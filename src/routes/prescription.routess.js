const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const upload = require('../middlewares/upload');
const controller = require('../controllers/prescription.controllers');

router.use(authenticate);

router.post('/', upload.single('file'), controller.upload);
router.get('/mine', controller.listMine);
router.get('/queue', requireRole('pharmacist', 'admin'), controller.queue);
router.get('/:id', controller.getById);
router.patch('/:id/review', requireRole('pharmacist', 'admin'), controller.review);

module.exports = router;
