const { LoyaltyLedger } = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/apiResponse')
const { getPagination } = require('../utils/pagination')
const loyaltyService = require('../services/loyalty.services')

/** GET /loyalty/balance */
const getBalance = asyncHandler(async (req, res) => {
  const balance = await loyaltyService.getBalance(req.user.id)
  return success(res, {
    balance,
    redemptionRate: loyaltyService.POINTS_REDEMPTION_RATE, // points per currency unit of discount
  })
})

/** GET /loyalty/history */
const getHistory = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { rows, count } = await LoyaltyLedger.findAndCountAll({
    where: { userId: req.user.id },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return paginated(res, rows, count, page, limit)
})

module.exports = { getBalance, getHistory }
