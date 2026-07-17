const { Op } = require('sequelize');
const { Product, Category, StockLevel, Branch } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const SORT_MAP = {
  price_asc: [['basePrice', 'ASC']],
  price_desc: [['basePrice', 'DESC']],
  name_asc: [['name', 'ASC']],
  newest: [['createdAt', 'DESC']],
};

/** GET /products — search & filter (PRD 4.2, Prompt 11/12) */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { q, categoryId, brand, requiresRx, minPrice, maxPrice, sort, branchId } = req.query;

  const where = { isActive: true };
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (categoryId) where.categoryId = categoryId;
  if (brand) where.brand = brand;
  if (requiresRx !== undefined) where.requiresRx = requiresRx === 'true';
  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) where.basePrice[Op.gte] = Number(minPrice);
    if (maxPrice) where.basePrice[Op.lte] = Number(maxPrice);
  }

  const include = [{ model: Category, as: 'category', attributes: ['id', 'name'] }];
  if (branchId) {
    include.push({
      model: StockLevel,
      as: 'stockLevels',
      where: { branchId },
      required: false,
      attributes: ['quantity', 'lowStockThreshold'],
    });
  }

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: SORT_MAP[sort] || SORT_MAP.newest,
    distinct: true,
  });

  const data = rows.map((p) => {
    const json = p.toJSON();
    if (branchId) {
      const stock = json.stockLevels?.[0];
      json.stockStatus = !stock || stock.quantity === 0
        ? 'out_of_stock'
        : stock.quantity <= stock.lowStockThreshold
        ? 'low_stock'
        : 'in_stock';
      json.branchQuantity = stock?.quantity ?? 0;
      delete json.stockLevels;
    }
    return json;
  });

  return paginated(res, data, count, page, limit);
});

/** GET /products/:id — product detail incl. per-branch stock status (Prompt 13) */
const getById = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const product = await Product.findByPk(req.params.id, {
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      branchId
        ? { model: StockLevel, as: 'stockLevels', where: { branchId }, required: false }
        : { model: StockLevel, as: 'stockLevels', include: [{ model: Branch, as: 'branch' }] },
    ],
  });
  if (!product) throw ApiError.notFound('Product not found');

  // Related products: same category, excluding self
  const related = await Product.findAll({
    where: { categoryId: product.categoryId, id: { [Op.ne]: product.id }, isActive: true },
    limit: 8,
  });

  return success(res, { product, related });
});

const create = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  return success(res, product, 201);
});

const update = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await product.update(req.body);
  return success(res, product);
});

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await product.update({ isActive: false });
  return success(res, { deactivated: true });
});

module.exports = { list, getById, create, update, remove };
