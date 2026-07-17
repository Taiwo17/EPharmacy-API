'use strict';

module.exports = (sequelize, DataTypes) => {
  const OtpCode = sequelize.define(
    'OtpCode',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      destination: { type: DataTypes.STRING, allowNull: false }, // email or phone
      purpose: {
        type: DataTypes.ENUM('signup_verify', 'login', 'password_reset'),
        allowNull: false,
      },
      codeHash: { type: DataTypes.STRING, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      consumedAt: { type: DataTypes.DATE, allowNull: true },
      attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { tableName: 'otp_codes', indexes: [{ fields: ['destination', 'purpose'] }] }
  );

  return OtpCode;
};
