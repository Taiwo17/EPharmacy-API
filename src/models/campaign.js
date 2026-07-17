'use strict';

module.exports = (sequelize, DataTypes) => {
  const Campaign = sequelize.define(
    'Campaign',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      channel: {
        type: DataTypes.ENUM('push', 'email', 'in_app'),
        allowNull: false,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      audienceSegment: {
        // e.g. { branchId, minSpend, purchaseFrequency, role }
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      promoCodeId: { type: DataTypes.UUID, allowNull: true },
      scheduledAt: { type: DataTypes.DATE, allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'sent', 'cancelled'),
        defaultValue: 'draft',
      },
      createdById: { type: DataTypes.UUID, allowNull: true },
    },
    { tableName: 'campaigns' }
  );

  Campaign.associate = (models) => {
    Campaign.belongsTo(models.PromoCode, { foreignKey: 'promoCodeId', as: 'promoCode' });
    Campaign.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
  };

  return Campaign;
};
