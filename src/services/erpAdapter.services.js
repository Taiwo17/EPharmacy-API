const { ERPSyncLog, Product, StockLevel } = require('../models');
const { ERP_SYNC_DIRECTION, ERP_SYNC_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * ERP Adapter — pluggable sync contract (PRD 5.7).
 *
 * Design: the platform never talks to a specific ERP directly. Instead:
 *  - INBOUND: an ERP connector calls handleInboundStockUpdate/handleInboundPriceUpdate
 *    (e.g. from a webhook route) whenever the ERP is the source of truth for stock/price.
 *  - OUTBOUND: the platform calls queueOutboundOrderSync whenever an order is placed,
 *    so the ERP connector can pick it up and push it into the ERP (platform is source
 *    of truth for orders).
 *  - Every sync attempt — inbound or outbound — is recorded in erp_sync_logs for audit
 *    and conflict-resolution review, regardless of whether ERP_SYNC_ENABLED is true.
 *
 * Swap this module's internals for a real connector (SOAP/REST/SFTP-CSV) without touching
 * any controller — everything else only calls the exported functions below.
 */

const isErpEnabled = () => process.env.ERP_SYNC_ENABLED === 'true';

async function handleInboundStockUpdate({ erpProductRef, branchId, quantity }) {
  const log = await ERPSyncLog.create({
    entityType: 'stock_level',
    direction: ERP_SYNC_DIRECTION.INBOUND,
    status: ERP_SYNC_STATUS.PENDING,
    payload: { erpProductRef, branchId, quantity },
  });

  try {
    const product = await Product.findOne({ where: { erpProductRef } });
    if (!product) throw new Error(`No product mapped to ERP ref ${erpProductRef}`);

    const [stockLevel] = await StockLevel.findOrCreate({
      where: { productId: product.id, branchId },
      defaults: { quantity: 0 },
    });
    stockLevel.quantity = quantity; // ERP is source of truth for stock — direct set, not delta
    await stockLevel.save();

    log.status = ERP_SYNC_STATUS.SUCCESS;
    log.entityId = stockLevel.id;
    log.processedAt = new Date();
    await log.save();
    return stockLevel;
  } catch (err) {
    log.status = ERP_SYNC_STATUS.FAILED;
    log.errorMessage = err.message;
    await log.save();
    logger.error(`ERP inbound stock sync failed: ${err.message}`);
    throw err;
  }
}

async function handleInboundPriceUpdate({ erpProductRef, basePrice }) {
  const log = await ERPSyncLog.create({
    entityType: 'product',
    direction: ERP_SYNC_DIRECTION.INBOUND,
    status: ERP_SYNC_STATUS.PENDING,
    payload: { erpProductRef, basePrice },
  });

  try {
    const product = await Product.findOne({ where: { erpProductRef } });
    if (!product) throw new Error(`No product mapped to ERP ref ${erpProductRef}`);

    product.basePrice = basePrice; // ERP is source of truth for price
    await product.save();

    log.status = ERP_SYNC_STATUS.SUCCESS;
    log.entityId = product.id;
    log.processedAt = new Date();
    await log.save();
    return product;
  } catch (err) {
    log.status = ERP_SYNC_STATUS.FAILED;
    log.errorMessage = err.message;
    await log.save();
    throw err;
  }
}

/** Called after an order is placed; queues (logs) the order for outbound push to ERP. */
async function queueOutboundOrderSync(order) {
  const log = await ERPSyncLog.create({
    entityType: 'order',
    entityId: order.id,
    direction: ERP_SYNC_DIRECTION.OUTBOUND,
    status: isErpEnabled() ? ERP_SYNC_STATUS.PENDING : ERP_SYNC_STATUS.SUCCESS,
    payload: { orderNumber: order.orderNumber, total: order.total, branchId: order.branchId },
  });

  if (!isErpEnabled()) {
    log.processedAt = new Date();
    log.errorMessage = 'ERP sync disabled — logged for audit only';
    await log.save();
    return log;
  }

  // TODO: push to real ERP connector (queue/worker), then mark SUCCESS/FAILED.
  return log;
}

module.exports = {
  isErpEnabled,
  handleInboundStockUpdate,
  handleInboundPriceUpdate,
  queueOutboundOrderSync,
};
