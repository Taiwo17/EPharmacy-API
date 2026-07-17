'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sku: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      brand: { type: DataTypes.STRING, allowNull: true },
      form: { type: DataTypes.STRING, allowNull: true }, // tablet, syrup, cream, etc.
      description: { type: DataTypes.TEXT, allowNull: true },
      dosage: { type: DataTypes.TEXT, allowNull: true },
      warnings: { type: DataTypes.TEXT, allowNull: true },
      images: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
      categoryId: { type: DataTypes.UUID, allowNull: true },
      requiresRx: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      basePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      // ERP-managed fields — ERP is source of truth for stock/price when sync enabled
      erpProductRef: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'products',
      indexes: [{ fields: ['category_id'] }, { fields: ['requires_rx'] }, { fields: ['name'] }],
    }
  );

  Product.associate = (models) => {
    Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    Product.hasMany(models.StockLevel, { foreignKey: 'productId', as: 'stockLevels' });
    Product.hasMany(models.OrderItem, { foreignKey: 'productId', as: 'orderItems' });
    Product.hasMany(models.CartItem, { foreignKey: 'productId', as: 'cartItems' });
  };

  return Product;
};
