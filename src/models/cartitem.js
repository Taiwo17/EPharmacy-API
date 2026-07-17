'use strict';

module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define(
    'CartItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      cartId: { type: DataTypes.UUID, allowNull: false },
      productId: { type: DataTypes.UUID, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      prescriptionId: { type: DataTypes.UUID, allowNull: true }, // attached if item requires Rx
    },
    {
      tableName: 'cart_items',
      indexes: [{ unique: true, fields: ['cart_id', 'product_id'] }],
    }
  );

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Cart, { foreignKey: 'cartId', as: 'cart' });
    CartItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    CartItem.belongsTo(models.Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
  };

  return CartItem;
};
