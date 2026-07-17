'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      icon: { type: DataTypes.STRING, allowNull: true },
      parentId: { type: DataTypes.UUID, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'categories' }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
    Category.belongsTo(models.Category, { foreignKey: 'parentId', as: 'parent' });
    Category.hasMany(models.Category, { foreignKey: 'parentId', as: 'children' });
  };

  return Category;
};
