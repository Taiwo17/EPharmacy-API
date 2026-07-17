const { Op } = require('sequelize');
const { PromoCode, Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { PROMO_DISCOUNT_TYPE } = require('../config/constants');

async function validatePromoCode(code, userId, subtotal) {
  const promo = await PromoCode.findOne({ where: { code: code.toUpperCase(), isActive: true } });

  if (!promo) throw ApiError.badRequest('Invalid promo code');

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) throw ApiError.badRequest('This promo code is not active yet');
  if (promo.expiresAt && promo.expiresAt < now) throw ApiError.badRequest('This promo code has expired');
  if (Number(subtotal) < Number(promo.minSpend)) {
    throw ApiError.badRequest(`Minimum spend of ${promo.minSpend} required for this code`);
  }
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    throw ApiError.badRequest('This promo code has reached its usage limit');
  }

  const timesUsedByUser = await Order.count({
    where: { promoCodeId: promo.id, customerId: userId, status: { [Op.ne]: 'cancelled' } },
  });
  if (timesUsedByUser >= promo.usageLimitPerUser) {
    throw ApiError.badRequest('You have already used this promo code');
  }

  return promo;
}

function computeDiscount(promo, subtotal) {
  let discount;
  if (promo.discountType === PROMO_DISCOUNT_TYPE.PERCENTAGE) {
    discount = (Number(subtotal) * Number(promo.discountValue)) / 100;
    if (promo.maxDiscountAmount) {
      discount = Math.min(discount, Number(promo.maxDiscountAmount));
    }
  } else {
    discount = Number(promo.discountValue);
  }
  return Math.min(discount, Number(subtotal));
}

module.exports = { validatePromoCode, computeDiscount };
