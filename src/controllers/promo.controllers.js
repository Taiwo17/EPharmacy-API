const { Op } = require('sequelize');
const { PromoCode } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

/** GET /promo-codes — customer-facing: active, non-expired codes (Prompt 25) */
const listActive = asyncHandler(async (req, res) => {
  const now = new Date();
  const codes = await PromoCode.findAll({
    where: {
      isActive: true,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }],
    },
    order: [['expiresAt', 'ASC']],
  });
  return success(res, codes);
});

/** GET /promo-codes/admin — admin management list */
const listAll = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, count } = await PromoCode.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']] });
  return paginated(res, rows, count, page, limit);
});

const create = asyncHandler(async (req, res) => {
  const promo = await PromoCode.create({ ...req.body, code: req.body.code.toUpperCase() });
  return success(res, promo, 201);
});

const update = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findByPk(req.params.id);
  if (!promo) throw ApiError.notFound('Promo code not found');
  await promo.update(req.body);
  return success(res, promo);
});

const remove = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findByPk(req.params.id);
  if (!promo) throw ApiError.notFound('Promo code not found');
  await promo.update({ isActive: false });
  return success(res, { deactivated: true });
});

module.exports = { listActive, listAll, create, update, remove };
