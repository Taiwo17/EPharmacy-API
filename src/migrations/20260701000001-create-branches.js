'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branches', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      city: { type: Sequelize.STRING },
      latitude: { type: Sequelize.DECIMAL(9, 6) },
      longitude: { type: Sequelize.DECIMAL(9, 6) },
      phone: { type: Sequelize.STRING },
      operating_hours: { type: Sequelize.JSONB, defaultValue: {} },
      service_radius_km: { type: Sequelize.FLOAT, defaultValue: 10 },
      status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
      is_multi_branch_hub: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('branches');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_branches_status";');
  },
};
