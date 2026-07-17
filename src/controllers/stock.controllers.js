const { Op } = require('sequelize')
const {
  StockLevel,
  Product,
  Branch,
  StockAuditLog,
  sequelize,
} = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { success, paginated } = require('../utils/apiResponse')
const { getPagination } = require('../utils/pagination')
const stockService = require('../services/stock.services')

/** GET /stock?branchId=&lowStockOnly= */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { branchId, lowStockOnly } = req.query

  const where = {}
  if (branchId) where.branchId = branchId
  if (lowStockOnly === 'true') {
    where.quantity = { [Op.lte]: sequelize.col('low_stock_threshold') }
  }

  const { rows, count } = await StockLevel.findAndCountAll({
    where,
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku', 'requiresRx'],
      },
      { model: Branch, as: 'branch', attributes: ['id', 'name'] },
    ],
    limit,
    offset,
    order: [['updatedAt', 'DESC']],
  })

  return paginated(res, rows, count, page, limit)
})

/** POST /stock — create a new stock record (new batch at a branch) */
const create = asyncHandler(async (req, res) => {
  const stockLevel = await StockLevel.create(req.body)
  return success(res, stockLevel, 201)
})

/** PATCH /stock/:id/adjust — manual adjustment, always audit-logged */
const adjust = asyncHandler(async (req, res) => {
  const { delta, reason, note } = req.body
  if (!delta || !reason)
    throw ApiError.badRequest('delta and reason are required')

  const stockLevel = await sequelize.transaction((transaction) =>
    stockService.adjustStock({
      stockLevelId: req.params.id,
      delta: Number(delta),
      reason,
      note,
      actorId: req.user.id,
      transaction,
    }),
  )

  return success(res, stockLevel)
})

/** GET /stock/:id/audit-log */
const auditLog = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { rows, count } = await StockAuditLog.findAndCountAll({
    where: { stockLevelId: req.params.id },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return paginated(res, rows, count, page, limit)
})

/**
 * POST /stock/bulk-import — CSV rows: sku,branchId,quantity,batchNumber,expiryDate
 * Expects `req.body.rows` pre-parsed by the client, or raw CSV text in `req.body.csv`.
 * (Actual multipart file parsing wired via the `upload` middleware at the route level.)
 */
const bulkImport = asyncHandler(async (req, res) => {
  const { rows } = req.body
  if (!Array.isArray(rows) || !rows.length) {
    throw ApiError.badRequest('rows must be a non-empty array of stock entries')
  }

  const results = { created: 0, updated: 0, errors: [] }

  for (const row of rows) {
    try {
      const product = await Product.findOne({ where: { sku: row.sku } })
      if (!product) {
        results.errors.push({ sku: row.sku, error: 'Product SKU not found' })
        continue
      }
      const [stockLevel, wasCreated] = await StockLevel.findOrCreate({
        where: {
          productId: product.id,
          branchId: row.branchId,
          batchNumber: row.batchNumber || null,
        },
        defaults: {
          quantity: Number(row.quantity) || 0,
          expiryDate: row.expiryDate || null,
        },
      })
      if (!wasCreated) {
        stockLevel.quantity = Number(row.quantity) || 0
        if (row.expiryDate) stockLevel.expiryDate = row.expiryDate
        await stockLevel.save()
        results.updated += 1
      } else {
        results.created += 1
      }
    } catch (err) {
      results.errors.push({ sku: row.sku, error: err.message })
    }
  }

  return success(res, results)
})

/** GET /stock/export?branchId= — returns JSON rows; front-end/portal converts to CSV/XLSX */
const exportStock = asyncHandler(async (req, res) => {
  const { branchId } = req.query
  const where = branchId ? { branchId } : {}
  const rows = await StockLevel.findAll({
    where,
    include: [
      { model: Product, as: 'product', attributes: ['name', 'sku'] },
      { model: Branch, as: 'branch', attributes: ['name'] },
    ],
  })
  return success(res, rows)
})

module.exports = { list, create, adjust, auditLog, bulkImport, exportStock }
