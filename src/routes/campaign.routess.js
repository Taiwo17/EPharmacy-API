const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const controller = require('../controllers/campaign.controllers');

router.use(authenticate, requireRole('admin'));

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.post('/:id/send', controller.send);
router.delete('/:id', controller.remove);

module.exports = router;
