'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReturnRequest = sequelize.define(
    'ReturnRequest',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false, unique: true },
      requestedBy: { type: DataTypes.UUID, allowNull: false },
      reason: {
        type: DataTypes.ENUM('changed_mind', 'wrong_item', 'damaged', 'other'),
        allowNull: false,
      },
      note: { type: DataTypes.TEXT, allowNull: true },
      photoUrl: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
        defaultValue: 'pending',
      },
      resolutionNote: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'return_requests' }
  );

  ReturnRequest.associate = (models) => {
    ReturnRequest.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    ReturnRequest.belongsTo(models.User, { foreignKey: 'requestedBy', as: 'requester' });
  };

  return ReturnRequest;
};
