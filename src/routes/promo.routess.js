const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const controller = require('../controllers/promo.controllers');

router.get('/', authenticate, controller.listActive);
router.get('/admin', authenticate, requireRole('admin'), controller.listAll);
router.post('/', authenticate, requireRole('admin'), controller.create);
router.patch('/:id', authenticate, requireRole('admin'), controller.update);
router.delete('/:id', authenticate, requireRole('admin'), controller.remove);

module.exports = router;
