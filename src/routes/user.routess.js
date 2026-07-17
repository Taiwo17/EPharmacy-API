const router = require('express').Router()
const { authenticate } = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const userController = require('../controllers/user.controllers')
const addressController = require('../controllers/address.controllers')
const paymentMethodController = require('../controllers/paymentMethod.controllers')
const reportController = require('../controllers/report.controllers')

router.use(authenticate)

router.get('/me', userController.getMe)
router.patch('/me', userController.updateMe)
router.post('/me/avatar', upload.single('file'), userController.uploadAvatar)
router.post('/me/change-password', userController.changePassword)
router.get('/me/spending-insights', reportController.spendingInsights)

router.get('/me/addresses', addressController.list)
router.post('/me/addresses', addressController.create)
router.patch('/me/addresses/:id', addressController.update)
router.delete('/me/addresses/:id', addressController.remove)

router.get('/me/payment-methods', paymentMethodController.list)
router.post('/me/payment-methods', paymentMethodController.create)
router.patch(
  '/me/payment-methods/:id/default',
  paymentMethodController.setDefault,
)
router.delete('/me/payment-methods/:id', paymentMethodController.remove)

module.exports = router
