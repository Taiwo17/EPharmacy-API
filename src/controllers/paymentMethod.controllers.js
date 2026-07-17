const { PaymentMethod, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

const list = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.findAll({
    where: { userId: req.user.id },
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
  });
  return success(res, methods);
});

/**
 * POST /payment-methods
 * Expects a `providerTokenRef` already produced by the client-side payment SDK
 * (Paystack/Flutterwave/Stripe "add card" flow) — this API never receives raw PANs.
 */
const create = asyncHandler(async (req, res) => {
  const method = await sequelize.transaction(async (transaction) => {
    if (req.body.isDefault) {
      await PaymentMethod.update({ isDefault: false }, { where: { userId: req.user.id }, transaction });
    }
    return PaymentMethod.create({ ...req.body, userId: req.user.id }, { transaction });
  });
  return success(res, method, 201);
});

const setDefault = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!method) throw ApiError.notFound('Payment method not found');

  await sequelize.transaction(async (transaction) => {
    await PaymentMethod.update({ isDefault: false }, { where: { userId: req.user.id }, transaction });
    method.isDefault = true;
    await method.save({ transaction });
  });

  return success(res, method);
});

const remove = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!method) throw ApiError.notFound('Payment method not found');
  await method.destroy();
  return success(res, { deleted: true });
});

module.exports = { list, create, setDefault, remove };
