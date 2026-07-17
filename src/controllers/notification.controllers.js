const { Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, count } = await Notification.findAndCountAll({
    where: { userId: req.user.id },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
  return paginated(res, rows, count, page, limit);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!notification) throw ApiError.notFound('Notification not found');
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  return success(res, notification);
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId: req.user.id, isRead: false } }
  );
  return success(res, { updated: true });
});

module.exports = { list, markRead, markAllRead };
