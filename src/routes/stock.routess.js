const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole, scopeToOwnBranch } = require('../middlewares/rbac');
const controller = require('../controllers/stock.controllers');

router.use(authenticate, requireRole('admin', 'branch_staff', 'pharmacist'));

router.get('/', controller.list);
router.post('/', scopeToOwnBranch, controller.create);
router.patch('/:id/adjust', controller.adjust);
router.get('/:id/audit-log', controller.auditLog);
router.post('/bulk-import', requireRole('admin', 'branch_staff'), controller.bulkImport);
router.get('/export', controller.exportStock);

module.exports = router;
