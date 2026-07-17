'use strict';
const { PRESCRIPTION_STATUS } = require('../config/constants');

module.exports = (sequelize, DataTypes) => {
  const Prescription = sequelize.define(
    'Prescription',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      customerId: { type: DataTypes.UUID, allowNull: false },
      imageUrl: { type: DataTypes.STRING, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true }, // customer note to pharmacist
      status: {
        type: DataTypes.ENUM(...Object.values(PRESCRIPTION_STATUS)),
        defaultValue: PRESCRIPTION_STATUS.SUBMITTED,
      },
      reviewerId: { type: DataTypes.UUID, allowNull: true },
      reviewNote: { type: DataTypes.TEXT, allowNull: true }, // pharmacist reason on reject/approve
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'prescriptions', indexes: [{ fields: ['status'] }, { fields: ['customer_id'] }] }
  );

  Prescription.associate = (models) => {
    Prescription.belongsTo(models.User, { foreignKey: 'customerId', as: 'customer' });
    Prescription.belongsTo(models.User, { foreignKey: 'reviewerId', as: 'reviewer' });
    Prescription.hasMany(models.Order, { foreignKey: 'prescriptionId', as: 'orders' });
  };

  return Prescription;
};
