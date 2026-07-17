const {
  Order,
  OrderItem,
  Product,
  Branch,
  Address,
  PaymentMethod,
  ReturnRequest,
  Cart,
  CartItem,
} = require('../models')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')
const { success, paginated } = require('../utils/apiResponse')
const { getPagination } = require('../utils/pagination')
const orderService = require('../services/order.services')
const storageService = require('../services/storage.services')
const { ORDER_STATUS } = require('../config/constants')

const ORDER_DETAIL_INCLUDE = [
  { model: OrderItem, as: 'items' },
  {
    model: Branch,
    as: 'branch',
    attributes: ['id', 'name', 'address', 'phone'],
  },
  { model: Address, as: 'address' },
  {
    model: PaymentMethod,
    as: 'paymentMethod',
    attributes: ['id', 'type', 'brand', 'last4'],
  },
  { model: ReturnRequest, as: 'returnRequest' },
]

/** POST /orders/checkout */
const checkout = asyncHandler(async (req, res) => {
  const { deliveryMethod, addressId, paymentMethodId, loyaltyPointsToRedeem } =
    req.body
  const order = await orderService.checkout({
    userId: req.user.id,
    deliveryMethod,
    addressId,
    paymentMethodId,
    loyaltyPointsToRedeem: Number(loyaltyPointsToRedeem) || 0,
  })
  const full = await Order.findByPk(order.id, { include: ORDER_DETAIL_INCLUDE })
  return success(res, full, 201)
})

/** GET /orders — customer's own order history, filterable by status segment */
const listMine = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { segment } = req.query // all | processing | delivered | cancelled

  const where = { customerId: req.user.id }
  if (segment === 'processing') {
    where.status = [
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.DISPATCHED,
      ORDER_STATUS.AWAITING_PRESCRIPTION,
    ]
  } else if (segment === 'delivered') {
    where.status = ORDER_STATUS.DELIVERED
  } else if (segment === 'cancelled') {
    where.status = [ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED]
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: OrderItem, as: 'items' }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return paginated(res, rows, count, page, limit)
})

/** GET /orders/queue — staff order queue, scoped to their branch (unless admin) */
const queue = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query)
  const { status, branchId } = req.query

  const where = {}
  if (status) where.status = status
  if (req.user.role === 'admin') {
    if (branchId) where.branchId = branchId
  } else {
    where.branchId = req.user.branchId
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: OrderItem, as: 'items' }],
    limit,
    offset,
    order: [['placedAt', 'ASC']],
  })
  return paginated(res, rows, count, page, limit)
})

const getById = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: ORDER_DETAIL_INCLUDE,
  })
  if (!order) throw ApiError.notFound('Order not found')

  const isOwner = order.customerId === req.user.id
  const isStaff = ['branch_staff', 'pharmacist', 'admin'].includes(
    req.user.role,
  )
  if (!isOwner && !isStaff) throw ApiError.forbidden()

  return success(res, order)
})

/** PATCH /orders/:id/status — staff dispatch workflow transitions */
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw ApiError.badRequest('Invalid order status')
  }
  const order = await orderService.transitionStatus(
    req.params.id,
    status,
    req.user.id,
  )
  return success(res, order)
})

/** POST /orders/:id/cancel — customer-initiated cancellation while still cancellable */
const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body
  const order = await Order.findByPk(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  if (order.customerId !== req.user.id) throw ApiError.forbidden()

  const cancellableStatuses = [
    ORDER_STATUS.PENDING_PAYMENT,
    ORDER_STATUS.AWAITING_PRESCRIPTION,
    ORDER_STATUS.PROCESSING,
  ]
  if (!cancellableStatuses.includes(order.status)) {
    throw ApiError.badRequest(
      'This order can no longer be cancelled — request a return instead',
    )
  }

  order.status = ORDER_STATUS.CANCELLED
  order.cancelledAt = new Date()
  order.cancelReason = reason || null
  await order.save()

  return success(res, order)
})

/** POST /orders/:id/return-request — post-delivery cancel/return (Prompt 24) */
const requestReturn = asyncHandler(async (req, res) => {
  const { reason, note } = req.body
  const order = await Order.findByPk(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  if (order.customerId !== req.user.id) throw ApiError.forbidden()
  if (order.status !== ORDER_STATUS.DELIVERED) {
    throw ApiError.badRequest(
      'Return requests are only available for delivered orders',
    )
  }

  let photoUrl = null
  if (req.file) {
    const uploaded = await storageService.uploadBuffer(req.file.buffer, {
      folder: 'returns',
      mimetype: req.file.mimetype,
      originalName: req.file.originalname,
    })
    photoUrl = uploaded.url
  }

  const returnRequest = await ReturnRequest.create({
    orderId: order.id,
    requestedBy: req.user.id,
    reason,
    note: note || null,
    photoUrl,
  })

  order.status = ORDER_STATUS.RETURN_REQUESTED
  await order.save()

  return success(res, returnRequest, 201)
})

/** POST /orders/:id/reorder — re-adds all items from a past order into the current cart */
const reorder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: 'items' }],
  })
  if (!order) throw ApiError.notFound('Order not found')
  if (order.customerId !== req.user.id) throw ApiError.forbidden()

  const [cart] = await Cart.findOrCreate({ where: { userId: req.user.id } })
  if (!cart.branchId) cart.branchId = order.branchId
  await cart.save()

  for (const item of order.items) {
    if (item.requiresRx) continue // Rx items must be re-attached with a fresh/valid prescription
    const product = await Product.findByPk(item.productId)
    if (!product || !product.isActive) continue

    const [cartItem, created] = await CartItem.findOrCreate({
      where: { cartId: cart.id, productId: item.productId },
      defaults: { quantity: item.quantity },
    })
    if (!created) {
      cartItem.quantity += item.quantity
      await cartItem.save()
    }
  }

  return success(res, { addedToCart: true })
})

module.exports = {
  checkout,
  listMine,
  queue,
  getById,
  updateStatus,
  cancel,
  requestReturn,
  reorder,
}
