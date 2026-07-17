'use strict';

module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    'Cart',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      branchId: { type: DataTypes.UUID, allowNull: true }, // stock validated against this branch
      promoCodeId: { type: DataTypes.UUID, allowNull: true },
    },
    { tableName: 'carts' }
  );

  Cart.associate = (models) => {
    Cart.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Cart.belongsTo(models.Branch, { foreignKey: 'branchId', as: 'branch' });
    Cart.belongsTo(models.PromoCode, { foreignKey: 'promoCodeId', as: 'promoCode' });
    Cart.hasMany(models.CartItem, { foreignKey: 'cartId', as: 'items' });
  };

  return Cart;
};
