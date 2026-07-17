'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_codes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.STRING },
      discount_type: { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      min_spend: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      max_discount_amount: { type: Sequelize.DECIMAL(12, 2) },
      starts_at: { type: Sequelize.DATE },
      expires_at: { type: Sequelize.DATE },
      usage_limit: { type: Sequelize.INTEGER },
      usage_limit_per_user: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      used_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('promo_codes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_promo_codes_discount_type";');
  },
};
