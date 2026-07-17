'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaigns', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      channel: { type: Sequelize.ENUM('push', 'email', 'in_app'), allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      audience_segment: { type: Sequelize.JSONB, defaultValue: {} },
      promo_code_id: { type: Sequelize.UUID, references: { model: 'promo_codes', key: 'id' }, onDelete: 'SET NULL' },
      scheduled_at: { type: Sequelize.DATE },
      sent_at: { type: Sequelize.DATE },
      status: { type: Sequelize.ENUM('draft', 'scheduled', 'sent', 'cancelled'), defaultValue: 'draft' },
      created_by_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('campaigns');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_campaigns_channel";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_campaigns_status";');
  },
};
