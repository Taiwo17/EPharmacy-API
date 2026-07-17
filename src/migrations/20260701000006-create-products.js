'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      sku: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      brand: { type: Sequelize.STRING },
      form: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      dosage: { type: Sequelize.TEXT },
      warnings: { type: Sequelize.TEXT },
      images: { type: Sequelize.JSONB, defaultValue: [] },
      category_id: { type: Sequelize.UUID, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      requires_rx: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      base_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'NGN' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      erp_product_ref: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['requires_rx']);
    await queryInterface.addIndex('products', ['name']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
