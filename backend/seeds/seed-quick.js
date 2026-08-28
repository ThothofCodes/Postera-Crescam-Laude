/**
 * Quick Seed Script
 *
 * Generates a small set of test data for quick testing.
 * Useful for development and CI/CD environments.
 *
 * Usage: node seeds/seed-quick.js
 *
 * Environment Variables:
 *   MONGO_URI - MongoDB connection string
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================================================
// Minimal Test Data
// ============================================================================

const USERS = [
  {
    name: 'Test Super Admin',
    email: 'superadmin@test.com',
    password: 'TestPass@123',
    role: 'SUPER_ADMIN',
    isOwner: true,
    superAdminLocked: true,
    isActive: true,
  },
  {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'TestPass@123',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'Test Staff',
    email: 'staff@test.com',
    password: 'TestPass@123',
    role: 'STAFF',
    departmentSlug: 'repair',
    isActive: true,
  },
  {
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'TestPass@123',
    role: 'client',
    isActive: true,
  },
];

const DEPARTMENTS = [
  { name: 'Internet Distribution', slug: 'internet', description: 'ISP packages, hotspot sessions, network management' },
  { name: 'Hardware Repair', slug: 'repair', description: 'Device repairs, job cards, parts inventory' },
  { name: 'Web Development', slug: 'webdev', description: 'Website design, web apps, retainer contracts' },
];

const PRODUCTS = [
  {
    name: 'Refurbished Laptop Core i5',
    slug: 'refurbished-laptop-core-i5',
    category: 'electronics',
    description: 'Refurbished Core i5 laptop, 8GB RAM, 256GB SSD.',
    price: 45000,
    stock: 5,
    featured: true,
  },
  {
    name: 'Wireless Mouse & Keyboard Combo',
    slug: 'wireless-mouse-keyboard-combo',
    category: 'accessories',
    description: 'Wireless mouse and keyboard combo.',
    price: 2500,
    stock: 20,
  },
  {
    name: 'USB Flash Drive 32GB',
    slug: 'usb-flash-drive-32gb',
    category: 'accessories',
    description: 'USB 3.0 flash drive, 32GB storage.',
    price: 600,
    stock: 50,
  },
];

const ORDERS = [
  {
    orderNumber: 'ORD-TEST-001',
    customer: { name: 'Test Customer', email: 'customer@test.com', phone: '+254700000001' },
    items: [
      {
        name: 'Refurbished Laptop Core i5', sku: 'ELEC-1001', quantity: 1, price: 45000, discount: 0, total: 45000,
      },
    ],
    subtotal: 45000,
    shipping: 500,
    tax: 7200,
    total: 52700,
    status: 'delivered',
    payment: { method: 'mpesa', status: 'completed', transactionId: 'MP-12345678' },
    shippingAddress: { street: '123 Test Street', city: 'Nairobi', country: 'Kenya' },
  },
  {
    orderNumber: 'ORD-TEST-002',
    customer: { name: 'Test Customer', email: 'customer@test.com', phone: '+254700000001' },
    items: [
      {
        name: 'Wireless Mouse & Keyboard Combo', sku: 'ACC-2001', quantity: 2, price: 2500, discount: 0, total: 5000,
      },
      {
        name: 'USB Flash Drive 32GB', sku: 'ACC-2002', quantity: 3, price: 600, discount: 0, total: 1800,
      },
    ],
    subtotal: 6800,
    shipping: 300,
    tax: 1088,
    total: 8188,
    status: 'processing',
    payment: { method: 'card', status: 'completed', transactionId: 'CC-87654321' },
    shippingAddress: { street: '456 Test Avenue', city: 'Mombasa', country: 'Kenya' },
  },
];

// ============================================================================
// Main Seed Function
// ============================================================================

async function seed() {
  console.log('\n⚡  Quick Seed Script');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (!process.env.MONGO_URI) {
    console.error('\n❌  MONGO_URI not set in .env\n');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected.\n');

  const startTime = Date.now();

  // Clear existing data
  console.log('🗑️   Clearing existing data...');
  await mongoose.connection.db.dropDatabase();
  console.log('✅  Database cleared.\n');

  // Create users
  console.log('👤  Creating users...');
  for (const userData of USERS) {
    const hashed = await bcrypt.hash(userData.password, 10);
    await mongoose.connection.db.collection('users').insertOne({
      ...userData,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${USERS.length} users created.\n`);

  // Create departments
  console.log('🏢  Creating departments...');
  for (const dept of DEPARTMENTS) {
    await mongoose.connection.db.collection('departments').insertOne({
      ...dept,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${DEPARTMENTS.length} departments created.\n`);

  // Create products
  console.log('📦  Creating products...');
  for (const product of PRODUCTS) {
    await mongoose.connection.db.collection('products').insertOne({
      ...product,
      isActive: true,
      rating: 4.5,
      reviewCount: 10,
      soldCount: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${PRODUCTS.length} products created.\n`);

  // Create orders
  console.log('🛒  Creating orders...');
  for (const order of ORDERS) {
    await mongoose.connection.db.collection('orders').insertOne({
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${ORDERS.length} orders created.\n`);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Summary
  console.log('══════════════════════════════════════════════════════════════════════════');
  console.log('  Quick Seed Completed Successfully!');
  console.log('══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Duration: ${duration}s`);
  console.log('');
  console.log('  Test Credentials:');
  console.log('    Super Admin: superadmin@test.com / TestPass@123');
  console.log('    Admin:       admin@test.com / TestPass@123');
  console.log('    Staff:       staff@test.com / TestPass@123');
  console.log('    Customer:    customer@test.com / TestPass@123');
  console.log('');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
