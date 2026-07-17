const { Cart, CartItem, Product, PromoCode, Prescription } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');
const promoService = require('../services/promo.services');
const { PRESCRIPTION_STATUS } = require('../config/constants');

const CART_INCLUDE = [
  {
    model: CartItem,
    as: 'items',
    include: [
      { model: Product, as: 'product' },
      { model: Prescription, as: 'prescription', attributes: ['id', 'status'] },
    ],
  },
  { model: PromoCode, as: 'promoCode' },
];

async function getOrCreateCart(userId) {
  const [cart] = await Cart.findOrCreate({ where: { userId } });
  return cart;
}

function summarize(cartJson) {
  const subtotal = cartJson.items.reduce(
    (sum, item) => sum + Number(item.product.basePrice) * item.quantity,
    0
  );
  return { ...cartJson, subtotal };
}

/** GET /cart */
const getCart = asyncHandler(async (req, res) => {
  await getOrCreateCart(req.user.id);
  const cart = await Cart.findOne({ where: { userId: req.user.id }, include: CART_INCLUDE });
  return success(res, summarize(cart.toJSON()));
});

/** POST /cart/branch — select the branch the cart's stock/pricing is validated against */
const setBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.body;
  const cart = await getOrCreateCart(req.user.id);

  if (cart.branchId && cart.branchId !== branchId) {
    // Switching branch invalidates stock guarantees for existing items — clear them.
    await CartItem.destroy({ where: { cartId: cart.id } });
  }
  cart.branchId = branchId;
  await cart.save();

  const refreshed = await Cart.findByPk(cart.id, { include: CART_INCLUDE });
  return success(res, summarize(refreshed.toJSON()));
});

/** POST /cart/items — add or increment an item */
const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, prescriptionId } = req.body;
  const cart = await getOrCreateCart(req.user.id);

  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) throw ApiError.notFound('Product not found');

  if (product.requiresRx) {
    if (!prescriptionId) {
      throw ApiError.badRequest('This item requires a prescription. Please attach one.');
    }
    const prescription = await Prescription.findByPk(prescriptionId);
    if (!prescription || prescription.customerId !== req.user.id) {
      throw ApiError.badRequest('Invalid prescription reference');
    }
  }

  const [item, created] = await CartItem.findOrCreate({
    where: { cartId: cart.id, productId },
    defaults: { quantity, prescriptionId: prescriptionId || null },
  });
  if (!created) {
    item.quantity += quantity;
    if (prescriptionId) item.prescriptionId = prescriptionId;
    await item.save();
  }

  const refreshed = await Cart.findByPk(cart.id, { include: CART_INCLUDE });
  return success(res, summarize(refreshed.toJSON()), 201);
});

/** PATCH /cart/items/:itemId — update quantity */
const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user.id);
  const item = await CartItem.findOne({ where: { id: req.params.itemId, cartId: cart.id } });
  if (!item) throw ApiError.notFound('Cart item not found');

  if (quantity <= 0) {
    await item.destroy();
  } else {
    item.quantity = quantity;
    await item.save();
  }

  const refreshed = await Cart.findByPk(cart.id, { include: CART_INCLUDE });
  return success(res, summarize(refreshed.toJSON()));
});

/** DELETE /cart/items/:itemId */
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const item = await CartItem.findOne({ where: { id: req.params.itemId, cartId: cart.id } });
  if (!item) throw ApiError.notFound('Cart item not found');
  await item.destroy();

  const refreshed = await Cart.findByPk(cart.id, { include: CART_INCLUDE });
  return success(res, summarize(refreshed.toJSON()));
});

/** POST /cart/promo — apply a promo code to the cart */
const applyPromo = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const cart = await getOrCreateCart(req.user.id);
  const cartWithItems = await Cart.findByPk(cart.id, { include: CART_INCLUDE });
  const subtotal = summarize(cartWithItems.toJSON()).subtotal;

  const promo = await promoService.validatePromoCode(code, req.user.id, subtotal);
  cart.promoCodeId = promo.id;
  await cart.save();

  const refreshed = await Cart.findByPk(cart.id, { include: CART_INCLUDE });
  const summary = summarize(refreshed.toJSON());
  summary.discount = promoService.computeDiscount(promo, summary.subtotal);
  return success(res, summary);
});

/** DELETE /cart/promo */
const removePromo = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  cart.promoCodeId = null;
  await cart.save();
  const refreshed = await Cart.findByPk(cart.id, { include: CART_INCLUDE });
  return success(res, summarize(refreshed.toJSON()));
});

module.exports = { getCart, setBranch, addItem, updateItem, removeItem, applyPromo, removePromo };
