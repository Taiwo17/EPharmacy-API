function success(res, data, statusCode = 200, meta = undefined) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

function paginated(res, rows, count, page, limit) {
  return res.status(200).json({
    success: true,
    data: rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 1,
    },
  });
}

module.exports = { success, paginated };
