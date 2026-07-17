'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('referrals', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      referrer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      referee_id: { type: Sequelize.UUID, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: { type: Sequelize.ENUM('invited', 'joined', 'rewarded'), defaultValue: 'invited' },
      reward_amount: { type: Sequelize.DECIMAL(12, 2) },
      rewarded_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('referrals');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_referrals_status";');
  },
};
