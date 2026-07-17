'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('erp_sync_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      entity_type: { type: Sequelize.ENUM('product', 'stock_level', 'order'), allowNull: false },
      entity_id: { type: Sequelize.UUID },
      direction: { type: Sequelize.ENUM('inbound', 'outbound'), allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'success', 'failed'), defaultValue: 'pending' },
      payload: { type: Sequelize.JSONB },
      error_message: { type: Sequelize.TEXT },
      processed_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('erp_sync_logs', ['entity_type', 'status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('erp_sync_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_erp_sync_logs_entity_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_erp_sync_logs_direction";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_erp_sync_logs_status";');
  },
};
