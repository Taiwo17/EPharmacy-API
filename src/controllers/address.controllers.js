const { Address, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

const list = asyncHandler(async (req, res) => {
  const addresses = await Address.findAll({
    where: { userId: req.user.id },
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
  });
  return success(res, addresses);
});

const create = asyncHandler(async (req, res) => {
  const address = await sequelize.transaction(async (transaction) => {
    if (req.body.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id }, transaction });
    }
    return Address.create({ ...req.body, userId: req.user.id }, { transaction });
  });
  return success(res, address, 201);
});

const update = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!address) throw ApiError.notFound('Address not found');

  await sequelize.transaction(async (transaction) => {
    if (req.body.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id }, transaction }
      );
    }
    await address.update(req.body, { transaction });
  });

  return success(res, address);
});

const remove = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!address) throw ApiError.notFound('Address not found');
  await address.destroy();
  return success(res, { deleted: true });
});

module.exports = { list, create, update, remove };
