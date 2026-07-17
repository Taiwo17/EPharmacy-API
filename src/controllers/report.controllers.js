const { Op, fn, col, literal } = require('sequelize');
const { Order, OrderItem, Product, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { ORDER_STATUS } = require('../config/constants');

/** GET /reports/spending-insights?month=YYYY-MM — customer-facing (Prompt 30) */
const spendingInsights = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const orders = await Order.findAll({
    where: {
      customerId: req.user.id,
      status: { [Op.ne]: ORDER_STATUS.CANCELLED },
      placedAt: { [Op.gte]: start, [Op.lt]: end },
    },
    include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'categoryId'] }] }],
  });

  const totalSpend = orders.reduce((sum, o) => sum + Number(o.total), 0);

  const categoryTotals = {};
  const productTotals = {};
  for (const order of orders) {
    for (const item of order.items) {
      const catId = item.product?.categoryId || 'uncategorized';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(item.lineTotal);
      productTotals[item.productNameSnapshot] =
        (productTotals[item.productNameSnapshot] || 0) + item.quantity;
    }
  }

  const topProducts = Object.entries(productTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, quantity]) => ({ name, quantity }));

  return success(res, {
    month,
    totalSpend,
    orderCount: orders.length,
    categoryBreakdown: Object.entries(categoryTotals).map(([categoryId, total]) => ({ categoryId, total })),
    topProducts,
  });
});

/** GET /reports/sales?branchId=&from=&to= — admin/branch-staff sales report */
const salesReport = asyncHandler(async (req, res) => {
  const { branchId, from, to } = req.query;
  const where = { status: ORDER_STATUS.DELIVERED };
  if (branchId) where.branchId = branchId;
  else if (req.user.role !== 'admin') where.branchId = req.user.branchId;
  if (from || to) {
    where.deliveredAt = {};
    if (from) where.deliveredAt[Op.gte] = new Date(from);
    if (to) where.deliveredAt[Op.lte] = new Date(to);
  }

  const totals = await Order.findOne({
    where,
    attributes: [
      [fn('COUNT', col('id')), 'orderCount'],
      [fn('SUM', col('total')), 'grossRevenue'],
      [fn('AVG', col('total')), 'averageOrderValue'],
    ],
    raw: true,
  });

  return success(res, totals);
});

/** GET /reports/inventory-turnover?branchId= — admin/branch-staff */
const inventoryTurnoverReport = asyncHandler(async (req, res) => {
  const { branchId, limit = 20 } = req.query;
  const where = {};
  if (branchId) where['$order.branch_id$'] = branchId;
  else if (req.user.role !== 'admin') where['$order.branch_id$'] = req.user.branchId;
  where['$order.status$'] = ORDER_STATUS.DELIVERED;

  const topMoving = await OrderItem.findAll({
    where,
    include: [{ model: Order, as: 'order', attributes: [] }],
    attributes: ['productId', 'productNameSnapshot', [fn('SUM', col('quantity')), 'unitsSold']],
    group: ['productId', 'productNameSnapshot'],
    order: [[literal('"unitsSold"'), 'DESC']],
    limit: Number(limit),
    subQuery: false,
  });

  return success(res, topMoving);
});

module.exports = { spendingInsights, salesReport, inventoryTurnoverReport };
