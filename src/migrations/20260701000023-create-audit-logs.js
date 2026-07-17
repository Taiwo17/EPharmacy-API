'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      actor_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      action: { type: Sequelize.STRING, allowNull: false },
      entity_type: { type: Sequelize.STRING },
      entity_id: { type: Sequelize.UUID },
      changes: { type: Sequelize.JSONB },
      ip_address: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('audit_logs', ['actor_id']);
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
