'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prescriptions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      image_url: { type: Sequelize.STRING, allowNull: false },
      notes: { type: Sequelize.TEXT },
      status: { type: Sequelize.ENUM('submitted', 'under_review', 'approved', 'rejected'), defaultValue: 'submitted' },
      reviewer_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      review_note: { type: Sequelize.TEXT },
      reviewed_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('prescriptions', ['status']);
    await queryInterface.addIndex('prescriptions', ['customer_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('prescriptions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_prescriptions_status";');
  },
};
