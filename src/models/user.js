'use strict';
const { ROLES, AUTH_PROVIDERS } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      passwordHash: { type: DataTypes.STRING, allowNull: true },
      role: {
        type: DataTypes.ENUM(...Object.values(ROLES)),
        allowNull: false,
        defaultValue: ROLES.CUSTOMER,
      },
      authProvider: {
        type: DataTypes.ENUM(...Object.values(AUTH_PROVIDERS)),
        allowNull: false,
        defaultValue: AUTH_PROVIDERS.LOCAL,
      },
      branchId: {
        // set for staff/pharmacist/branch_staff roles
        type: DataTypes.UUID,
        allowNull: true,
      },
      avatarUrl: { type: DataTypes.STRING, allowNull: true },
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'users',
      indexes: [{ fields: ['role'] }, { fields: ['branch_id'] }],
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Branch, { foreignKey: 'branchId', as: 'branch' });
    User.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
    User.hasMany(models.Address, { foreignKey: 'userId', as: 'addresses' });
    User.hasMany(models.PaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
    User.hasMany(models.Order, { foreignKey: 'customerId', as: 'orders' });
    User.hasMany(models.Prescription, { foreignKey: 'customerId', as: 'prescriptions' });
    User.hasMany(models.Prescription, { foreignKey: 'reviewerId', as: 'reviewedPrescriptions' });
    User.hasMany(models.LoyaltyLedger, { foreignKey: 'userId', as: 'loyaltyEntries' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    User.hasOne(models.ReferralCode, { foreignKey: 'userId', as: 'referralCode' });
    User.hasMany(models.Referral, { foreignKey: 'referrerId', as: 'referralsMade' });
    User.hasOne(models.Referral, { foreignKey: 'refereeId', as: 'referredBy' });
    User.hasMany(models.AuditLog, { foreignKey: 'actorId', as: 'auditLogs' });
    User.hasOne(models.Cart, { foreignKey: 'userId', as: 'cart' });
  };

  return User;
};
