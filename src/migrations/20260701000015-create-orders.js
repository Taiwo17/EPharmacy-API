'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      order_number: { type: Sequelize.STRING, allowNull: false, unique: true },
      customer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      branch_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'branches', key: 'id' }, onDelete: 'RESTRICT' },
      status: {
        type: Sequelize.ENUM('pending_payment', 'awaiting_prescription', 'processing', 'packed', 'dispatched', 'delivered', 'cancelled', 'return_requested', 'returned'),
        defaultValue: 'pending_payment',
      },
      delivery_method: { type: Sequelize.ENUM('delivery', 'pickup'), allowNull: false },
      address_id: { type: Sequelize.UUID, references: { model: 'addresses', key: 'id' }, onDelete: 'SET NULL' },
      payment_method_id: { type: Sequelize.UUID, references: { model: 'payment_methods', key: 'id' }, onDelete: 'SET NULL' },
      prescription_id: { type: Sequelize.UUID, references: { model: 'prescriptions', key: 'id' }, onDelete: 'SET NULL' },
      promo_code_id: { type: Sequelize.UUID, references: { model: 'promo_codes', key: 'id' }, onDelete: 'SET NULL' },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      delivery_fee: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      loyalty_points_redeemed: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      loyalty_discount_value: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'NGN' },
      placed_at: { type: Sequelize.DATE },
      packed_at: { type: Sequelize.DATE },
      dispatched_at: { type: Sequelize.DATE },
      delivered_at: { type: Sequelize.DATE },
      cancelled_at: { type: Sequelize.DATE },
      cancel_reason: { type: Sequelize.STRING },
      erp_sync_status: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('orders', ['branch_id']);
    await queryInterface.addIndex('orders', ['customer_id']);
    await queryInterface.addIndex('orders', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_delivery_method";');
  },
};
