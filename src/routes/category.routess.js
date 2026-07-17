const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const controller = require('../controllers/category.controllers');

router.get('/', controller.list);
router.post('/', authenticate, requireRole('admin'), controller.create);
router.patch('/:id', authenticate, requireRole('admin'), controller.update);
router.delete('/:id', authenticate, requireRole('admin'), controller.remove);

module.exports = router;
