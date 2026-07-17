'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false },
      productId: { type: DataTypes.UUID, allowNull: false },
      productNameSnapshot: { type: DataTypes.STRING, allowNull: false },
      requiresRx: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      lineTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { tableName: 'order_items' }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    OrderItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return OrderItem;
};
