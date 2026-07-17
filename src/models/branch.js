'use strict';
const { BRANCH_STATUS } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define(
    'Branch',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: true },
      latitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      operatingHours: {
        // e.g. { mon: ["08:00","20:00"], tue: [...], ... }
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      serviceRadiusKm: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 10 },
      status: {
        type: DataTypes.ENUM(...Object.values(BRANCH_STATUS)),
        defaultValue: BRANCH_STATUS.ACTIVE,
      },
      isMultiBranchHub: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: 'branches' }
  );

  Branch.associate = (models) => {
    Branch.hasMany(models.User, { foreignKey: 'branchId', as: 'staff' });
    Branch.hasMany(models.StockLevel, { foreignKey: 'branchId', as: 'stockLevels' });
    Branch.hasMany(models.Order, { foreignKey: 'branchId', as: 'orders' });
  };

  return Branch;
};
