'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const branchId = uuidv4();
    await queryInterface.bulkInsert('branches', [
      {
        id: branchId,
        name: 'MedCart — Victoria Island',
        address: '12 Adeola Odeku Street, Victoria Island, Lagos',
        city: 'Lagos',
        latitude: 6.4281,
        longitude: 3.4219,
        phone: '+2348000000000',
        operating_hours: JSON.stringify({ mon_sat: ['08:00', '21:00'], sun: ['10:00', '18:00'] }),
        service_radius_km: 12,
        status: 'active',
        is_multi_branch_hub: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    const adminId = uuidv4();
    const pharmacistId = uuidv4();
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        full_name: 'MedCart Admin',
        email: 'admin@medcart.app',
        phone: '+2348011111111',
        password_hash: passwordHash,
        role: 'admin',
        auth_provider: 'local',
        is_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: pharmacistId,
        full_name: 'Dr. Amaka Chukwu',
        email: 'pharmacist@medcart.app',
        phone: '+2348022222222',
        password_hash: passwordHash,
        role: 'pharmacist',
        auth_provider: 'local',
        branch_id: branchId,
        is_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    const painReliefId = uuidv4();
    const vitaminsId = uuidv4();
    const antibioticsId = uuidv4();
    await queryInterface.bulkInsert('categories', [
      { id: painReliefId, name: 'Pain Relief', slug: 'pain-relief', icon: 'medication', is_active: true, created_at: now, updated_at: now },
      { id: vitaminsId, name: 'Vitamins & Supplements', slug: 'vitamins-supplements', icon: 'vitamins', is_active: true, created_at: now, updated_at: now },
      { id: antibioticsId, name: 'Antibiotics', slug: 'antibiotics', icon: 'prescription', is_active: true, created_at: now, updated_at: now },
    ]);

    const paracetamolId = uuidv4();
    const vitaminCId = uuidv4();
    const amoxicillinId = uuidv4();
    await queryInterface.bulkInsert('products', [
      {
        id: paracetamolId,
        sku: 'PARA-500-20',
        name: 'Paracetamol 500mg (20 tablets)',
        brand: 'Emzor',
        form: 'tablet',
        description: 'For relief of mild to moderate pain and fever.',
        dosage: '1-2 tablets every 4-6 hours, max 8 tablets/24h.',
        warnings: 'Do not exceed stated dose. Consult a doctor if symptoms persist beyond 3 days.',
        images: JSON.stringify([]),
        category_id: painReliefId,
        requires_rx: false,
        base_price: 850.0,
        currency: 'NGN',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: vitaminCId,
        sku: 'VITC-1000-30',
        name: 'Vitamin C 1000mg (30 tablets)',
        brand: 'Swiss Pharma',
        form: 'tablet',
        description: 'Immune system support supplement.',
        dosage: '1 tablet daily.',
        warnings: 'Consult a doctor before use if pregnant or nursing.',
        images: JSON.stringify([]),
        category_id: vitaminsId,
        requires_rx: false,
        base_price: 3200.0,
        currency: 'NGN',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: amoxicillinId,
        sku: 'AMOX-500-21',
        name: 'Amoxicillin 500mg (21 capsules)',
        brand: 'GSK',
        form: 'capsule',
        description: 'Broad-spectrum antibiotic for bacterial infections.',
        dosage: 'As directed by prescribing physician.',
        warnings: 'Complete the full course even if symptoms improve. Prescription required.',
        images: JSON.stringify([]),
        category_id: antibioticsId,
        requires_rx: true,
        base_price: 4500.0,
        currency: 'NGN',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('stock_levels', [
      { id: uuidv4(), product_id: paracetamolId, branch_id: branchId, quantity: 500, low_stock_threshold: 50, created_at: now, updated_at: now },
      { id: uuidv4(), product_id: vitaminCId, branch_id: branchId, quantity: 200, low_stock_threshold: 20, created_at: now, updated_at: now },
      { id: uuidv4(), product_id: amoxicillinId, branch_id: branchId, quantity: 15, low_stock_threshold: 20, created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('promo_codes', [
      {
        id: uuidv4(),
        code: 'WELCOME10',
        description: '10% off your first order',
        discount_type: 'percentage',
        discount_value: 10,
        min_spend: 2000,
        max_discount_amount: 2000,
        usage_limit: null,
        usage_limit_per_user: 1,
        used_count: 0,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('promo_codes', null, {});
    await queryInterface.bulkDelete('stock_levels', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('branches', null, {});
  },
};
