'use strict';
const { PROMO_DISCOUNT_TYPE } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const PromoCode = sequelize.define(
    'PromoCode',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.STRING, allowNull: true },
      discountType: {
        type: DataTypes.ENUM(...Object.values(PROMO_DISCOUNT_TYPE)),
        allowNull: false,
      },
      discountValue: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      minSpend: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      maxDiscountAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      startsAt: { type: DataTypes.DATE, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      usageLimit: { type: DataTypes.INTEGER, allowNull: true }, // total redemptions allowed, null = unlimited
      usageLimitPerUser: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      usedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'promo_codes' }
  );

  PromoCode.associate = (models) => {
    PromoCode.hasMany(models.Order, { foreignKey: 'promoCodeId', as: 'orders' });
    PromoCode.hasMany(models.Cart, { foreignKey: 'promoCodeId', as: 'carts' });
  };

  return PromoCode;
};
