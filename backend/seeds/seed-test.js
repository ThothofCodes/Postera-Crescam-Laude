/**
 * Test Seed Script
 * 
 * Creates minimal test data for CI/CD environments.
 * Optimized for speed and minimal resource usage.
 * 
 * Usage: node seeds/seed-test.js
 * 
 * Environment Variables:
 *   MONGO_URI - MongoDB connection string
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Minimal test data
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
  { name: 'Internet Distribution', slug: 'internet', description: 'Test department' },
  { name: 'Hardware Repair', slug: 'repair', description: 'Test department' },
];

const PRODUCTS = [
  {
    name: 'Test Product',
    slug: 'test-product',
    category: 'electronics',
    description: 'Test product for CI/CD',
    price: 1000,
    stock: 10,
    isActive: true,
  },
];

const SERVICES = [
  {
    name: 'Test Service',
    category: 'test',
    basePrice: 500,
    priceUnit: 'per item',
    isActive: true,
  },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('\n❌  MONGO_URI not set\n');
    process.exit(1);
  }

  console.log('\n🔌  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected.\n');

  console.log('🧪  Seeding test database...\n');

  // Clear existing data
  await mongoose.connection.db.dropDatabase();
  console.log('🗑️   Database cleared.');

  // Create users
  console.log('👤  Creating test users...');
  for (const userData of USERS) {
    const hashed = await bcrypt.hash(userData.password, 10);
    await mongoose.connection.db.collection('users').insertOne({
      ...userData,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${USERS.length} users created.`);

  // Create departments
  console.log('🏢  Creating test departments...');
  for (const dept of DEPARTMENTS) {
    await mongoose.connection.db.collection('departments').insertOne({
      ...dept,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${DEPARTMENTS.length} departments created.`);

  // Create products
  console.log('📦  Creating test products...');
  for (const product of PRODUCTS) {
    await mongoose.connection.db.collection('products').insertOne({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${PRODUCTS.length} products created.`);

  // Create services
  console.log('🛠   Creating test services...');
  for (const service of SERVICES) {
    await mongoose.connection.db.collection('services').insertOne({
      ...service,
      totalRevenue: 0,
      bookingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`✅  ${SERVICES.length} services created.`);

  console.log('\n✅  Test database seeded successfully.\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
