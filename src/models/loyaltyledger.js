'use strict';
const { LOYALTY_ENTRY_TYPE } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const LoyaltyLedger = sequelize.define(
    'LoyaltyLedger',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      points: { type: DataTypes.INTEGER, allowNull: false }, // positive for earned, negative for redeemed
      type: {
        type: DataTypes.ENUM(...Object.values(LOYALTY_ENTRY_TYPE)),
        allowNull: false,
      },
      refOrderId: { type: DataTypes.UUID, allowNull: true },
      description: { type: DataTypes.STRING, allowNull: true },
      balanceAfter: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'loyalty_ledgers', indexes: [{ fields: ['user_id'] }] }
  );

  LoyaltyLedger.associate = (models) => {
    LoyaltyLedger.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    LoyaltyLedger.belongsTo(models.Order, { foreignKey: 'refOrderId', as: 'order' });
  };

  return LoyaltyLedger;
};
