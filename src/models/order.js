'use strict';
const { ORDER_STATUS, DELIVERY_METHOD } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      customerId: { type: DataTypes.UUID, allowNull: false },
      branchId: { type: DataTypes.UUID, allowNull: false },
      status: {
        type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
        defaultValue: ORDER_STATUS.PENDING_PAYMENT,
      },
      deliveryMethod: {
        type: DataTypes.ENUM(...Object.values(DELIVERY_METHOD)),
        allowNull: false,
      },
      addressId: { type: DataTypes.UUID, allowNull: true }, // required if deliveryMethod = delivery
      paymentMethodId: { type: DataTypes.UUID, allowNull: true },
      prescriptionId: { type: DataTypes.UUID, allowNull: true },
      promoCodeId: { type: DataTypes.UUID, allowNull: true },

      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      deliveryFee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      loyaltyPointsRedeemed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      loyaltyDiscountValue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },

      placedAt: { type: DataTypes.DATE, allowNull: true },
      packedAt: { type: DataTypes.DATE, allowNull: true },
      dispatchedAt: { type: DataTypes.DATE, allowNull: true },
      deliveredAt: { type: DataTypes.DATE, allowNull: true },
      cancelledAt: { type: DataTypes.DATE, allowNull: true },
      cancelReason: { type: DataTypes.STRING, allowNull: true },

      // ERP: platform is source of truth for orders, but we track outbound sync state
      erpSyncStatus: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'orders',
      indexes: [
        { fields: ['branch_id'] },
        { fields: ['customer_id'] },
        { fields: ['status'] },
      ],
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'customerId', as: 'customer' });
    Order.belongsTo(models.Branch, { foreignKey: 'branchId', as: 'branch' });
    Order.belongsTo(models.Address, { foreignKey: 'addressId', as: 'address' });
    Order.belongsTo(models.PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
    Order.belongsTo(models.Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
    Order.belongsTo(models.PromoCode, { foreignKey: 'promoCodeId', as: 'promoCode' });
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items' });
    Order.hasMany(models.LoyaltyLedger, { foreignKey: 'refOrderId', as: 'loyaltyEntries' });
    Order.hasOne(models.ReturnRequest, { foreignKey: 'orderId', as: 'returnRequest' });
  };

  return Order;
};
