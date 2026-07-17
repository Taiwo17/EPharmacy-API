'use strict';
const { ERP_SYNC_DIRECTION, ERP_SYNC_STATUS } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const ERPSyncLog = sequelize.define(
    'ERPSyncLog',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      entityType: {
        type: DataTypes.ENUM('product', 'stock_level', 'order'),
        allowNull: false,
      },
      entityId: { type: DataTypes.UUID, allowNull: true },
      direction: {
        type: DataTypes.ENUM(...Object.values(ERP_SYNC_DIRECTION)),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ERP_SYNC_STATUS)),
        defaultValue: ERP_SYNC_STATUS.PENDING,
      },
      payload: { type: DataTypes.JSONB, allowNull: true },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      processedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'erp_sync_logs',
      indexes: [{ fields: ['entity_type', 'status'] }],
    }
  );

  return ERPSyncLog;
};
