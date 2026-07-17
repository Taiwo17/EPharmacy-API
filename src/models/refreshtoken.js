'use strict';

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      token: { type: DataTypes.STRING, allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
      userAgent: { type: DataTypes.STRING, allowNull: true },
      ipAddress: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'refresh_tokens' }
  );

  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return RefreshToken;
};
