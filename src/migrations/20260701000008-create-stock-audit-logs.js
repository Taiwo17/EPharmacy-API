'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      stock_level_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'stock_levels', key: 'id' }, onDelete: 'CASCADE' },
      actor_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      change_quantity: { type: Sequelize.INTEGER, allowNull: false },
      previous_quantity: { type: Sequelize.INTEGER, allowNull: false },
      new_quantity: { type: Sequelize.INTEGER, allowNull: false },
      reason: { type: Sequelize.STRING, allowNull: false },
      note: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('stock_audit_logs');
  },
};
