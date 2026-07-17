'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('referral_codes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      reward_giver_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      reward_receiver_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('referral_codes');
  },
};
