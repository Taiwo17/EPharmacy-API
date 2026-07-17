const { Referral, User } = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const { success, paginated } = require('../utils/apiResponse')
const { getPagination } = require('../utils/pagination')
const referralService = require('../services/referral.services')

/** GET /referrals/my-code */
const getMyCode = asyncHandler(async (req, res) => {
  const referralCode = await referralService.getOrCreateReferralCode(
    req.user.id,
  )
  return success(res, referralCode)
})

/** GET /referrals/history */
const getHistory = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { rows, count } = await Referral.findAndCountAll({
    where: { referrerId: req.user.id },
    include: [{ model: User, as: 'referee', attributes: ['id', 'fullName'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return paginated(res, rows, count, page, limit)
})

module.exports = { getMyCode, getHistory }
