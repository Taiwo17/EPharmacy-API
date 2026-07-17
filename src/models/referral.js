'use strict';
const { REFERRAL_STATUS } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define(
    'Referral',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      referrerId: { type: DataTypes.UUID, allowNull: false },
      refereeId: { type: DataTypes.UUID, allowNull: true }, // set once invitee signs up
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM(...Object.values(REFERRAL_STATUS)),
        defaultValue: REFERRAL_STATUS.INVITED,
      },
      rewardAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      rewardedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'referrals' }
  );

  Referral.associate = (models) => {
    Referral.belongsTo(models.User, { foreignKey: 'referrerId', as: 'referrer' });
    Referral.belongsTo(models.User, { foreignKey: 'refereeId', as: 'referee' });
  };

  return Referral;
};
