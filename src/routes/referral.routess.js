const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const controller = require('../controllers/referral.controllers');

router.use(authenticate);

router.get('/my-code', controller.getMyCode);
router.get('/history', controller.getHistory);

module.exports = router;
