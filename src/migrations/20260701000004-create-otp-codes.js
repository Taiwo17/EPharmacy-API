'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp_codes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      destination: { type: Sequelize.STRING, allowNull: false },
      purpose: { type: Sequelize.ENUM('signup_verify', 'login', 'password_reset'), allowNull: false },
      code_hash: { type: Sequelize.STRING, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      consumed_at: { type: Sequelize.DATE },
      attempts: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('otp_codes', ['destination', 'purpose']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('otp_codes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_otp_codes_purpose";');
  },
};
