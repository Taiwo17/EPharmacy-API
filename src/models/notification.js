'use strict';
const { NOTIFICATION_TYPE } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      type: {
        type: DataTypes.ENUM(...Object.values(NOTIFICATION_TYPE)),
        allowNull: false,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.STRING, allowNull: false },
      data: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} }, // deep-link payload
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'notifications', indexes: [{ fields: ['user_id', 'is_read'] }] }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notification;
};
