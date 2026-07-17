'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token: { type: Sequelize.STRING, allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      user_agent: { type: Sequelize.STRING },
      ip_address: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
