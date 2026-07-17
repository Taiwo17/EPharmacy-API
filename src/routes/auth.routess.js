const router = require('express').Router()
const validate = require('../middlewares/validate')
const schemas = require('../validators/auth.validator')
const controller = require('../controllers/auth.controllers')
const { authenticate } = require('../middlewares/auth')

router.get('/profile', authenticate, controller.getProfile)
router.post('/register', validate(schemas.register), controller.register)
router.post('/login', validate(schemas.login), controller.login)
router.post('/refresh', validate(schemas.refresh), controller.refresh)
router.post('/logout', controller.logout)
router.post('/otp/send', validate(schemas.sendOtp), controller.sendOtp)
router.post('/otp/verify', validate(schemas.verifyOtp), controller.verifyOtp)
router.post(
  '/password/forgot',
  validate(schemas.forgotPassword),
  controller.forgotPassword,
)
router.post(
  '/password/reset',
  validate(schemas.resetPassword),
  controller.resetPassword,
)

module.exports = router
