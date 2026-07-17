'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      actorId: { type: DataTypes.UUID, allowNull: true },
      action: { type: DataTypes.STRING, allowNull: false }, // e.g. 'product.update','prescription.approve'
      entityType: { type: DataTypes.STRING, allowNull: true },
      entityId: { type: DataTypes.UUID, allowNull: true },
      changes: { type: DataTypes.JSONB, allowNull: true },
      ipAddress: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'audit_logs', indexes: [{ fields: ['actor_id'] }, { fields: ['entity_type', 'entity_id'] }] }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
  };

  return AuditLog;
};
