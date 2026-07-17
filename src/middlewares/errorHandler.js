const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, details } = err;

  if (!(err instanceof ApiError)) {
    // Sequelize validation / unique constraint errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      statusCode = 400;
      message = 'Validation error';
      details = err.errors?.map((e) => e.message);
    } else {
      statusCode = 500;
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    }
  }

  if (statusCode >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.originalUrl });
  }

  res.status(statusCode || 500).json({
    success: false,
    message: message || 'Internal server error',
    ...(details ? { details } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
