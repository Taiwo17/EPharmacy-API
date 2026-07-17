'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_methods', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('card', 'bank_transfer', 'wallet', 'cash_on_pickup'), allowNull: false },
      provider: { type: Sequelize.STRING },
      provider_customer_ref: { type: Sequelize.STRING },
      provider_token_ref: { type: Sequelize.STRING },
      brand: { type: Sequelize.STRING },
      last4: { type: Sequelize.STRING(4) },
      expiry_month: { type: Sequelize.INTEGER },
      expiry_year: { type: Sequelize.INTEGER },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('payment_methods');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payment_methods_type";');
  },
};
