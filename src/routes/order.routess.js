const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const upload = require('../middlewares/upload');
const controller = require('../controllers/order.controllers');

router.use(authenticate);

router.post('/checkout', controller.checkout);
router.get('/', controller.listMine);
router.get('/queue', requireRole('branch_staff', 'pharmacist', 'admin'), controller.queue);
router.get('/:id', controller.getById);
router.patch('/:id/status', requireRole('branch_staff', 'pharmacist', 'admin'), controller.updateStatus);
router.post('/:id/cancel', controller.cancel);
router.post('/:id/return-request', upload.single('file'), controller.requestReturn);
router.post('/:id/reorder', controller.reorder);

module.exports = router;
