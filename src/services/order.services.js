const {
  sequelize,
  Cart,
  CartItem,
  Product,
  StockLevel,
  Order,
  OrderItem,
  Prescription,
} = require('../models')
const ApiError = require('../utils/ApiError')
const { generateOrderNumber } = require('../utils/orderNumber')
const {
  ORDER_STATUS,
  PRESCRIPTION_STATUS,
  DELIVERY_METHOD,
} = require('../config/constants')
const stockService = require('./stock.services')
const promoService = require('./promo.services')
const loyaltyService = require('./loyalty.services')
const erpAdapter = require('./erpAdapter.services')
const referralService = require('./referral.services')
const { notifyUser } = require('./notification.services')

const FLAT_DELIVERY_FEE = 1500 // stand-in until a delivery-fee/logistics rules engine is confirmed

/**
 * Checkout: converts the customer's cart into a confirmed Order.
 * Runs inside a DB transaction so stock deduction, order creation, and
 * loyalty/promo bookkeeping either all succeed or all roll back together.
 */
async function checkout({
  userId,
  deliveryMethod,
  addressId,
  paymentMethodId,
  loyaltyPointsToRedeem = 0,
}) {
  return sequelize
    .transaction(async (transaction) => {
      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }],
          },
        ],
        transaction,
      })

      if (!cart || !cart.items.length) {
        throw ApiError.badRequest('Your cart is empty')
      }
      if (!cart.branchId) {
        throw ApiError.badRequest('Select a branch before checking out')
      }
      if (deliveryMethod === DELIVERY_METHOD.DELIVERY && !addressId) {
        throw ApiError.badRequest(
          'A delivery address is required for home delivery',
        )
      }

      // 1. Validate Rx items have an approved prescription attached
      let linkedPrescriptionId = null
      for (const item of cart.items) {
        if (item.product.requiresRx) {
          if (!item.prescriptionId) {
            throw ApiError.badRequest(
              `"${item.product.name}" requires a prescription. Please attach one before checkout.`,
            )
          }
          const prescription = await Prescription.findByPk(
            item.prescriptionId,
            { transaction },
          )
          if (
            !prescription ||
            prescription.status !== PRESCRIPTION_STATUS.APPROVED
          ) {
            throw ApiError.badRequest(
              `The prescription for "${item.product.name}" is not yet approved by a pharmacist.`,
            )
          }
          linkedPrescriptionId = prescription.id
        }
      }

      // 2. Compute subtotal from live product prices (never trust client-sent prices)
      let subtotal = 0
      const lineItems = cart.items.map((item) => {
        const unitPrice = Number(item.product.basePrice)
        const lineTotal = unitPrice * item.quantity
        subtotal += lineTotal
        return {
          productId: item.productId,
          productNameSnapshot: item.product.name,
          requiresRx: item.product.requiresRx,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        }
      })

      // 3. Promo code
      let discount = 0
      if (cart.promoCodeId) {
        const promo = await promoService.validatePromoCode(
          (await cart.getPromoCode()).code,
          userId,
          subtotal,
        )
        discount = promoService.computeDiscount(promo, subtotal)
      }

      // 4. Loyalty redemption (on top of promo, capped at remaining payable amount)
      let loyaltyDiscountValue = 0
      if (loyaltyPointsToRedeem > 0) {
        const remainingAfterPromo = subtotal - discount
        const { discountValue } = await loyaltyService.redeemPoints(
          userId,
          loyaltyPointsToRedeem,
          null, // refOrderId patched in after order is created
          { transaction },
        )
        loyaltyDiscountValue = Math.min(discountValue, remainingAfterPromo)
      }

      const deliveryFee =
        deliveryMethod === DELIVERY_METHOD.DELIVERY ? FLAT_DELIVERY_FEE : 0
      const total =
        Math.max(subtotal - discount - loyaltyDiscountValue, 0) + deliveryFee

      // 5. Deduct stock per line item (fails the whole transaction if any item is short)
      for (const item of cart.items) {
        await stockService.deductForOrder({
          productId: item.productId,
          branchId: cart.branchId,
          quantity: item.quantity,
          actorId: userId,
          transaction,
        })
      }

      // 6. Create the order + order items
      const requiresPrescriptionGate =
        lineItems.some((li) => li.requiresRx) && !linkedPrescriptionId
      const order = await Order.create(
        {
          orderNumber: generateOrderNumber(),
          customerId: userId,
          branchId: cart.branchId,
          status: requiresPrescriptionGate
            ? ORDER_STATUS.AWAITING_PRESCRIPTION
            : ORDER_STATUS.PROCESSING,
          deliveryMethod,
          addressId:
            deliveryMethod === DELIVERY_METHOD.DELIVERY ? addressId : null,
          paymentMethodId,
          prescriptionId: linkedPrescriptionId,
          promoCodeId: cart.promoCodeId,
          subtotal,
          discount,
          deliveryFee,
          loyaltyPointsRedeemed: loyaltyPointsToRedeem,
          loyaltyDiscountValue,
          total,
          placedAt: new Date(),
        },
        { transaction },
      )

      await OrderItem.bulkCreate(
        lineItems.map((li) => ({ ...li, orderId: order.id })),
        { transaction },
      )

      // 7. Earn loyalty points on the paid amount
      await loyaltyService.earnPoints(userId, total, order.id, { transaction })

      // 8. Clear the cart
      await CartItem.destroy({ where: { cartId: cart.id }, transaction })
      cart.promoCodeId = null
      await cart.save({ transaction })

      return order
    })
    .then(async (order) => {
      // Side effects outside the DB transaction (safe to retry independently of the order write)
      await erpAdapter.queueOutboundOrderSync(order)
      await notifyUser(order.customerId, {
        type: 'order_update',
        title: 'Order placed!',
        body: `Your order ${order.orderNumber} has been received and is being processed.`,
        data: { orderId: order.id },
      })
      return order
    })
}

/** Staff/pharmacist-facing status transitions (order queue → dispatch workflow, PRD 5.3). */
async function transitionStatus(orderId, nextStatus, actorId) {
  const order = await Order.findByPk(orderId)
  if (!order) throw ApiError.notFound('Order not found')

  const timestampField = {
    [ORDER_STATUS.PACKED]: 'packedAt',
    [ORDER_STATUS.DISPATCHED]: 'dispatchedAt',
    [ORDER_STATUS.DELIVERED]: 'deliveredAt',
    [ORDER_STATUS.CANCELLED]: 'cancelledAt',
  }[nextStatus]

  order.status = nextStatus
  if (timestampField) order[timestampField] = new Date()
  await order.save()

  await notifyUser(order.customerId, {
    type: 'order_update',
    title: 'Order status updated',
    body: `Your order ${order.orderNumber} is now "${nextStatus.replace('_', ' ')}".`,
    data: { orderId: order.id, status: nextStatus },
  })

  if (nextStatus === ORDER_STATUS.DELIVERED) {
    await referralService
      .rewardQualifyingReferral(order.customerId)
      .catch(() => null)
  }

  return order
}

module.exports = { checkout, transitionStatus, FLAT_DELIVERY_FEE }
