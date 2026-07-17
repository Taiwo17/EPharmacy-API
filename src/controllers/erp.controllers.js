const crypto = require('crypto')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { success, paginated } = require('../utils/apiResponse')
const erpAdapter = require('../services/erpAdapter.services')
const { ERPSyncLog } = require('../models')
const { getPagination } = require('../utils/pagination')

/** Verifies the ERP_WEBHOOK_SECRET HMAC signature sent as `x-erp-signature`. */
function verifySignature(req) {
  const secret = process.env.ERP_WEBHOOK_SECRET
  const signature = req.headers['x-erp-signature']
  if (!secret || !signature) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

/** POST /erp/webhook/stock — { erpProductRef, branchId, quantity } */
const inboundStock = asyncHandler(async (req, res) => {
  if (!verifySignature(req))
    throw ApiError.unauthorized('Invalid webhook signature')
  const stockLevel = await erpAdapter.handleInboundStockUpdate(req.body)
  return success(res, stockLevel)
})

/** POST /erp/webhook/price — { erpProductRef, basePrice } */
const inboundPrice = asyncHandler(async (req, res) => {
  if (!verifySignature(req))
    throw ApiError.unauthorized('Invalid webhook signature')
  const product = await erpAdapter.handleInboundPriceUpdate(req.body)
  return success(res, product)
})

/** GET /erp/sync-logs — admin visibility into sync health/conflicts */
const syncLogs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { status, direction } = req.query
  const where = {}
  if (status) where.status = status
  if (direction) where.direction = direction

  const { rows, count } = await ERPSyncLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return paginated(res, rows, count, page, limit)
})

module.exports = { inboundStock, inboundPrice, syncLogs }
