const Joi = require('joi');

const phoneOrEmail = Joi.string().required().messages({
  'any.required': 'Email or phone is required',
});

module.exports = {
  register: {
    body: Joi.object({
      fullName: Joi.string().min(2).max(120).required(),
      email: Joi.string().email().optional(),
      phone: Joi.string().min(7).max(20).optional(),
      password: Joi.string().min(8).max(128).required(),
      referralCode: Joi.string().optional(),
    }).or('email', 'phone'),
  },
  login: {
    body: Joi.object({
      identifier: phoneOrEmail, // email or phone
      password: Joi.string().required(),
    }),
  },
  refresh: {
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },
  sendOtp: {
    body: Joi.object({
      destination: phoneOrEmail,
      purpose: Joi.string().valid('signup_verify', 'login', 'password_reset').required(),
    }),
  },
  verifyOtp: {
    body: Joi.object({
      destination: phoneOrEmail,
      purpose: Joi.string().valid('signup_verify', 'login', 'password_reset').required(),
      code: Joi.string().length(6).required(),
    }),
  },
  forgotPassword: {
    body: Joi.object({
      destination: phoneOrEmail,
    }),
  },
  resetPassword: {
    body: Joi.object({
      destination: phoneOrEmail,
      code: Joi.string().length(6).required(),
      newPassword: Joi.string().min(8).max(128).required(),
    }),
  },
};
