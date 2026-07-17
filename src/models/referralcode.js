'use strict';

module.exports = (sequelize, DataTypes) => {
  const ReferralCode = sequelize.define(
    'ReferralCode',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      rewardGiverAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      rewardReceiverAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    },
    { tableName: 'referral_codes' }
  );

  ReferralCode.associate = (models) => {
    ReferralCode.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ReferralCode;
};
