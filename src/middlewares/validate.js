const ApiError = require('../utils/ApiError');

/**
 * Usage: router.post('/x', validate(schema), handler)
 * schema: { body?: Joi.object, params?: Joi.object, query?: Joi.object }
 */
function validate(schema) {
  return (req, res, next) => {
    const toValidate = ['body', 'params', 'query'].filter((key) => schema[key]);
    for (const key of toValidate) {
      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        return next(
          ApiError.badRequest(
            'Validation failed',
            error.details.map((d) => d.message)
          )
        );
      }
      req[key] = value;
    }
    next();
  };
}

module.exports = validate;
