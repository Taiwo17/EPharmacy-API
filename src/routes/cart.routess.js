const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const controller = require('../controllers/cart.controllers');

router.use(authenticate);

router.get('/', controller.getCart);
router.post('/branch', controller.setBranch);
router.post('/items', controller.addItem);
router.patch('/items/:itemId', controller.updateItem);
router.delete('/items/:itemId', controller.removeItem);
router.post('/promo', controller.applyPromo);
router.delete('/promo', controller.removePromo);

module.exports = router;
