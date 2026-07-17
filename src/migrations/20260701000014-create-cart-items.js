'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      cart_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'carts', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      prescription_id: { type: Sequelize.UUID, references: { model: 'prescriptions', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('cart_items', ['cart_id', 'product_id'], { unique: true, name: 'cart_items_cart_product_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('cart_items');
  },
};
