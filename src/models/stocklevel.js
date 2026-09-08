'use strict'

module.exports = (sequelize, DataTypes) => {
  const StockLevel = sequelize.define(
    'StockLevel',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: { type: DataTypes.UUID, allowNull: false },
      branchId: { type: DataTypes.UUID, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      batchNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'batch_number',
      },
      expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
      lowStockThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
    },
    {
      tableName: 'stock_levels',
      indexes: [
        { unique: true, fields: ['product_id', 'branch_id', 'batch_number'] },
        { fields: ['branch_id'] },
      ],
    },
  )

  StockLevel.associate = (models) => {
    StockLevel.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    })
    StockLevel.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch',
    })
  }

  return StockLevel
}
