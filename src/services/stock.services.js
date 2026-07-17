const { StockLevel, StockAuditLog, Sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const LOCK_UPDATE = Sequelize.Transaction.LOCK.UPDATE;

/**
 * All stock quantity changes MUST go through this function so every mutation
 * is captured in stock_audit_logs (PRD 5.1: "stock adjustment/audit log").
 */
async function adjustStock({ stockLevelId, delta, reason, actorId, note, transaction }) {
  const stockLevel = await StockLevel.findByPk(stockLevelId, { transaction, lock: transaction ? LOCK_UPDATE : undefined });
  if (!stockLevel) throw ApiError.notFound('Stock level not found');

  const previousQuantity = stockLevel.quantity;
  const newQuantity = previousQuantity + delta;
  if (newQuantity < 0) {
    throw ApiError.badRequest('Insufficient stock for this operation');
  }

  stockLevel.quantity = newQuantity;
  await stockLevel.save({ transaction });

  await StockAuditLog.create(
    {
      stockLevelId,
      actorId: actorId || null,
      changeQuantity: delta,
      previousQuantity,
      newQuantity,
      reason,
      note: note || null,
    },
    { transaction }
  );

  if (newQuantity <= stockLevel.lowStockThreshold) {
    // TODO: hook into notification.service to alert branch staff/admin of low stock
    logger.warn(`Low stock alert: stockLevel=${stockLevelId} qty=${newQuantity}`);
  }

  return stockLevel;
}

/** Deducts stock for a confirmed order line item; throws if insufficient stock. */
async function deductForOrder({ productId, branchId, quantity, actorId, orderId, transaction }) {
  const stockLevel = await StockLevel.findOne({
    where: { productId, branchId },
    order: [['expiryDate', 'ASC']], // FEFO: first-expiry-first-out
    transaction,
    lock: transaction ? LOCK_UPDATE : undefined,
  });

  if (!stockLevel || stockLevel.quantity < quantity) {
    throw ApiError.badRequest('One or more items are out of stock at this branch');
  }

  return adjustStock({
    stockLevelId: stockLevel.id,
    delta: -quantity,
    reason: 'order_deduction',
    actorId,
    note: orderId ? `Order ${orderId}` : null,
    transaction,
  });
}

module.exports = { adjustStock, deductForOrder };
