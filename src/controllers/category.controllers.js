const { Op, fn, col } = require('sequelize');
const { Category, Product } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = { isActive: true };
  if (search) where.name = { [Op.iLike]: `%${search}%` };

  const categories = await Category.findAll({
    where,
    order: [['name', 'ASC']],
    attributes: {
      include: [[fn('COUNT', col('products.id')), 'itemCount']],
    },
    include: [{ model: Product, as: 'products', attributes: [], where: { isActive: true }, required: false }],
    group: ['Category.id'],
  });

  return success(res, categories);
});

const create = asyncHandler(async (req, res) => {
  const { name, icon, parentId } = req.body;
  const category = await Category.create({ name, icon, parentId, slug: slugify(name) });
  return success(res, category, 201);
});

const update = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  const updates = { ...req.body };
  if (updates.name) updates.slug = slugify(updates.name);
  await category.update(updates);
  return success(res, category);
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  await category.update({ isActive: false });
  return success(res, { deactivated: true });
});

module.exports = { list, create, update, remove };
