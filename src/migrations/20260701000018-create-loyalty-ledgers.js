'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('loyalty_ledgers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      points: { type: Sequelize.INTEGER, allowNull: false },
      type: { type: Sequelize.ENUM('earned', 'redeemed', 'expired', 'adjusted'), allowNull: false },
      ref_order_id: { type: Sequelize.UUID, references: { model: 'orders', key: 'id' }, onDelete: 'SET NULL' },
      description: { type: Sequelize.STRING },
      balance_after: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('loyalty_ledgers', ['user_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('loyalty_ledgers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loyalty_ledgers_type";');
  },
};
