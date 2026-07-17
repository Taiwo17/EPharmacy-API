'use strict';

module.exports = (sequelize, DataTypes) => {
  const StockAuditLog = sequelize.define(
    'StockAuditLog',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      stockLevelId: { type: DataTypes.UUID, allowNull: false },
      actorId: { type: DataTypes.UUID, allowNull: true },
      changeQuantity: { type: DataTypes.INTEGER, allowNull: false }, // +/- delta
      previousQuantity: { type: DataTypes.INTEGER, allowNull: false },
      newQuantity: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.STRING, allowNull: false }, // e.g. 'manual_adjustment','order_deduction','erp_sync','restock'
      note: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'stock_audit_logs' }
  );

  StockAuditLog.associate = (models) => {
    StockAuditLog.belongsTo(models.StockLevel, { foreignKey: 'stockLevelId', as: 'stockLevel' });
    StockAuditLog.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
  };

  return StockAuditLog;
};
