'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('return_requests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      order_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      requested_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      reason: { type: Sequelize.ENUM('changed_mind', 'wrong_item', 'damaged', 'other'), allowNull: false },
      note: { type: Sequelize.TEXT },
      photo_url: { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected', 'completed'), defaultValue: 'pending' },
      resolution_note: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('return_requests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_return_requests_reason";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_return_requests_status";');
  },
};
