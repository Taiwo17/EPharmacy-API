const { LoyaltyLedger, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { LOYALTY_ENTRY_TYPE } = require('../config/constants');

// Business rule: 1 point earned per whole currency unit spent, redeemable at 100 points = 1 currency unit.
// Tune these in one place as the loyalty program evolves.
const POINTS_PER_CURRENCY_UNIT = 1;
const POINTS_REDEMPTION_RATE = 100; // points per currency unit of discount

async function getBalance(userId, options = {}) {
  const last = await LoyaltyLedger.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']],
    transaction: options.transaction,
  });
  return last ? last.balanceAfter : 0;
}

async function earnPoints(userId, orderTotal, refOrderId, options = {}) {
  const pointsEarned = Math.floor(Number(orderTotal) * POINTS_PER_CURRENCY_UNIT);
  if (pointsEarned <= 0) return null;

  const currentBalance = await getBalance(userId, options);
  return LoyaltyLedger.create(
    {
      userId,
      points: pointsEarned,
      type: LOYALTY_ENTRY_TYPE.EARNED,
      refOrderId,
      description: `Earned on order`,
      balanceAfter: currentBalance + pointsEarned,
    },
    { transaction: options.transaction }
  );
}

async function redeemPoints(userId, pointsToRedeem, refOrderId, options = {}) {
  const currentBalance = await getBalance(userId, options);
  if (pointsToRedeem > currentBalance) {
    throw ApiError.badRequest('Insufficient loyalty points balance');
  }

  const discountValue = pointsToRedeem / POINTS_REDEMPTION_RATE;

  await LoyaltyLedger.create(
    {
      userId,
      points: -pointsToRedeem,
      type: LOYALTY_ENTRY_TYPE.REDEEMED,
      refOrderId,
      description: `Redeemed at checkout`,
      balanceAfter: currentBalance - pointsToRedeem,
    },
    { transaction: options.transaction }
  );

  return { discountValue };
}

module.exports = { getBalance, earnPoints, redeemPoints, POINTS_REDEMPTION_RATE };
