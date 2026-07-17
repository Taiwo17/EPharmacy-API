'use strict';

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    'Address',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      label: { type: DataTypes.STRING, allowNull: true }, // Home, Work, etc.
      street: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: true },
      country: { type: DataTypes.STRING, allowNull: true },
      latitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      deliveryInstructions: { type: DataTypes.TEXT, allowNull: true },
      isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: 'addresses' }
  );

  Address.associate = (models) => {
    Address.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Address.hasMany(models.Order, { foreignKey: 'addressId', as: 'orders' });
  };

  return Address;
};
