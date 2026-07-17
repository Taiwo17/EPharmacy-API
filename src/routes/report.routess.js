const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const controller = require('../controllers/report.controllers');

router.use(authenticate, requireRole('admin', 'branch_staff'));

router.get('/sales', controller.salesReport);
router.get('/inventory-turnover', controller.inventoryTurnoverReport);

module.exports = router;
