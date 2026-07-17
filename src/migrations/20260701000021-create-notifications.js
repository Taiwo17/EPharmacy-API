'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('order_update', 'prescription_status', 'promo', 'loyalty', 'system'), allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      body: { type: Sequelize.STRING, allowNull: false },
      data: { type: Sequelize.JSONB, defaultValue: {} },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      read_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  },
};
