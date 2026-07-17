'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      full_name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true },
      phone: { type: Sequelize.STRING, unique: true },
      password_hash: { type: Sequelize.STRING },
      role: {
        type: Sequelize.ENUM('customer', 'branch_staff', 'pharmacist', 'admin'),
        allowNull: false,
        defaultValue: 'customer',
      },
      auth_provider: {
        type: Sequelize.ENUM('local', 'google', 'apple'),
        allowNull: false,
        defaultValue: 'local',
      },
      branch_id: {
        type: Sequelize.UUID,
        references: { model: 'branches', key: 'id' },
        onDelete: 'SET NULL',
      },
      avatar_url: { type: Sequelize.STRING },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      last_login_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['branch_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_auth_provider";');
  },
};
