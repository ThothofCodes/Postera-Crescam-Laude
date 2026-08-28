/**
 * Production Seed Script
 * 
 * Creates minimal production data.
 * Only creates admin user and departments.
 * 
 * Usage: node seeds/seed-prod.js
 * 
 * Environment Variables:
 *   MONGO_URI - MongoDB connection string
 *   SUPER_ADMIN_EMAIL - Admin email (required)
 *   SUPER_ADMIN_PASSWORD - Admin password (required)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

const DEPARTMENTS = [
  { name: 'Internet Distribution', slug: 'internet', description: 'ISP packages, hotspot sessions, network management' },
  { name: 'Web Development', slug: 'webdev', description: 'Website design, web apps, retainer contracts' },
  { name: 'PlayStation Arena', slug: 'playstation', description: 'Gaming sessions, tournaments, console management' },
  { name: 'Hardware Repair', slug: 'repair', description: 'Device repairs, job cards, parts inventory' },
  { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security audits, contracts, incident management' },
  { name: 'Gov Admin Assistance', slug: 'govadmin', description: 'e-Citizen, KRA, NTSA, document processing' },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('\n❌  MONGO_URI not set\n');
    process.exit(1);
  }

  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error('\n❌  SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env\n');
    process.exit(1);
  }

  console.log('\n🔌  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected.\n');

  console.log('🏭  Seeding production database...\n');

  // Check if admin already exists
  const existingAdmin = await mongoose.connection.db.collection('users').findOne({ email: SUPER_ADMIN_EMAIL });
  
  if (existingAdmin) {
    console.log(`ℹ️   Admin user already exists: ${SUPER_ADMIN_EMAIL}`);
    console.log('    Skipping admin creation.\n');
  } else {
    // Create super admin
    console.log('👤  Creating super admin...');
    const hashed = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    await mongoose.connection.db.collection('users').insertOne({
      name: 'Super Admin',
      email: SUPER_ADMIN_EMAIL,
      password: hashed,
      role: 'SUPER_ADMIN',
      isOwner: true,
      superAdminLocked: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅  Super admin created: ${SUPER_ADMIN_EMAIL}\n`);
  }

  // Create departments if they don't exist
  console.log('🏢  Creating departments...');
  let deptCount = 0;
  for (const dept of DEPARTMENTS) {
    const exists = await mongoose.connection.db.collection('departments').findOne({ slug: dept.slug });
    if (!exists) {
      await mongoose.connection.db.collection('departments').insertOne({
        ...dept,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      deptCount++;
    }
  }
  console.log(`✅  ${deptCount} new departments created.\n`);

  console.log('══════════════════════════════════════════════════');
  console.log('  Production Database Seeded Successfully!');
  console.log('══════════════════════════════════════════════════');
  console.log('');
  console.log('  Admin Login:');
  console.log(`    URL:      https://yourdomain.com/admin/super`);
  console.log(`    Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log('    Password: (as set in env)');
  console.log('');
  console.log('══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
