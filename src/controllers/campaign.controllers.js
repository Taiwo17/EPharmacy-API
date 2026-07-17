const { Op } = require('sequelize')
const { Campaign, User } = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { success, paginated } = require('../utils/apiResponse')
const { getPagination } = require('../utils/pagination')
const { notifyMany } = require('../services/notification.services')

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { rows, count } = await Campaign.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return paginated(res, rows, count, page, limit)
})

const create = asyncHandler(async (req, res) => {
  const campaign = await Campaign.create({
    ...req.body,
    createdById: req.user.id,
    status: 'draft',
  })
  return success(res, campaign, 201)
})

const update = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id)
  if (!campaign) throw ApiError.notFound('Campaign not found')
  if (campaign.status === 'sent')
    throw ApiError.conflict('Cannot edit a campaign that has already been sent')
  await campaign.update(req.body)
  return success(res, campaign)
})

/**
 * POST /campaigns/:id/send — resolves the audience_segment filter against Users
 * and fans out in-app + push notifications. Segment shape: { role?, branchId?, minOrders? }
 * Complex behavioral segments (e.g. minOrders/minSpend) are intentionally left as a documented
 * extension point — wire in a query against the orders table once segment rules are finalized.
 */
const send = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id)
  if (!campaign) throw ApiError.notFound('Campaign not found')
  if (campaign.status === 'sent')
    throw ApiError.conflict('Campaign already sent')

  const segment = campaign.audienceSegment || {}
  const where = { isActive: true, role: 'customer' }
  if (segment.branchId) where.branchId = segment.branchId

  const audience = await User.findAll({ where, attributes: ['id'] })
  await notifyMany(
    audience.map((u) => u.id),
    {
      type: 'promo',
      title: campaign.title,
      body: campaign.body,
      data: { campaignId: campaign.id },
    },
  )

  campaign.status = 'sent'
  campaign.sentAt = new Date()
  await campaign.save()

  return success(res, { campaign, audienceSize: audience.length })
})

const remove = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id)
  if (!campaign) throw ApiError.notFound('Campaign not found')
  if (campaign.status === 'sent')
    throw ApiError.conflict('Cannot delete a sent campaign')
  await campaign.destroy()
  return success(res, { deleted: true })
})

module.exports = { list, create, update, send, remove }
