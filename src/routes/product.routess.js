const router = require('express').Router()
const { authenticate } = require('../middlewares/auth')
const { requireRole } = require('../middlewares/rbac')
const controller = require('../controllers/product.controllers')
const upload = require('../middlewares/upload')

router.get('/', controller.list)
router.get('/:id', controller.getById)

router.post(
  '/',
  authenticate,
  requireRole('admin', 'branch_staff'),
  upload.array('images', 5),
  controller.create,
)
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'branch_staff'),
  controller.update,
)
router.delete('/:id', authenticate, requireRole('admin'), controller.remove)

module.exports = router
