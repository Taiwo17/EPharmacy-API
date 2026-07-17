'use strict';
const { PAYMENT_METHOD_TYPE } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const PaymentMethod = sequelize.define(
    'PaymentMethod',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      type: {
        type: DataTypes.ENUM(...Object.values(PAYMENT_METHOD_TYPE)),
        allowNull: false,
      },
      provider: { type: DataTypes.STRING, allowNull: true }, // paystack, flutterwave, stripe
      providerCustomerRef: { type: DataTypes.STRING, allowNull: true },
      providerTokenRef: { type: DataTypes.STRING, allowNull: true }, // tokenized card ref, never raw PAN
      brand: { type: DataTypes.STRING, allowNull: true }, // visa, mastercard
      last4: { type: DataTypes.STRING(4), allowNull: true },
      expiryMonth: { type: DataTypes.INTEGER, allowNull: true },
      expiryYear: { type: DataTypes.INTEGER, allowNull: true },
      isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: 'payment_methods' }
  );

  PaymentMethod.associate = (models) => {
    PaymentMethod.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    PaymentMethod.hasMany(models.Order, { foreignKey: 'paymentMethodId', as: 'orders' });
  };

  return PaymentMethod;
};
