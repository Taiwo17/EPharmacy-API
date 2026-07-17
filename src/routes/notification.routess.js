const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const controller = require('../controllers/notification.controllers');

router.use(authenticate);

router.get('/', controller.list);
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);

module.exports = router;
