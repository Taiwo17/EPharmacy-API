const router = require('express').Router();
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const controller = require('../controllers/branch.controllers');

// Public/customer browsing (branch selection screen works pre-login too)
router.get('/', optionalAuthenticate, controller.list);
router.get('/:id', optionalAuthenticate, controller.getById);

// Admin management
router.post('/', authenticate, requireRole('admin'), controller.create);
router.patch('/:id', authenticate, requireRole('admin'), controller.update);
router.delete('/:id', authenticate, requireRole('admin'), controller.remove);

module.exports = router;
