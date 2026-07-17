'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_levels', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onDelete: 'CASCADE' },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      batch_number: { type: Sequelize.STRING },
      expiry_date: { type: Sequelize.DATEONLY },
      low_stock_threshold: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('stock_levels', ['product_id', 'branch_id', 'batch_number'], { unique: true, name: 'stock_levels_product_branch_batch_uq' });
    await queryInterface.addIndex('stock_levels', ['branch_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('stock_levels');
  },
};
