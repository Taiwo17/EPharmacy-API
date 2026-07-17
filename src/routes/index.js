const router = require('express').Router()

router.use('/auth', require('./auth.routess'))
router.use('/users', require('./user.routess'))
router.use('/branches', require('./branch.routess'))
router.use('/categories', require('./category.routess'))
router.use('/products', require('./product.routess'))
router.use('/stock', require('./stock.routess'))
router.use('/prescriptions', require('./prescription.routess'))
router.use('/cart', require('./cart.routess'))
router.use('/orders', require('./order.routess'))
router.use('/promo-codes', require('./promo.routess'))
router.use('/loyalty', require('./loyalty.routess'))
router.use('/referrals', require('./referral.routess'))
router.use('/notifications', require('./notification.routess'))
router.use('/reports', require('./report.routess'))
router.use('/campaigns', require('./campaign.routess'))
router.use('/erp', require('./erp.routess'))

router.get('/health', (req, res) =>
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  }),
)

module.exports = router
