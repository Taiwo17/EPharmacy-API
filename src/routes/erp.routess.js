const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const controller = require('../controllers/erp.controllers');

// Webhooks are authenticated via HMAC signature (x-erp-signature), not user session.
router.post('/webhook/stock', controller.inboundStock);
router.post('/webhook/price', controller.inboundPrice);

router.get('/sync-logs', authenticate, requireRole('admin'), controller.syncLogs);

module.exports = router;
