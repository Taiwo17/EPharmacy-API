const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const controller = require('../controllers/loyalty.controllers');

router.use(authenticate);

router.get('/balance', controller.getBalance);
router.get('/history', controller.getHistory);

module.exports = router;
