// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Run once:  node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Credentials ──────────────────────────────────────────────────────────────
// ── Credentials are read from environment variables — NEVER hardcoded ──────────
// Set these in backend/.env before running:  node seed.js
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!SUPER_ADMIN_PASSWORD || !ADMIN_PASSWORD) {
  console.error('\n❌  Set SEED_SUPER_ADMIN_PASSWORD and SEED_ADMIN_PASSWORD in .env before seeding.');
  console.error('     Example:  SEED_SUPER_ADMIN_PASSWORD=YourStrongPassword@2026\n');
  process.exit(1);
}

const SUPER_ADMIN = {
  name: 'Thoth of Codes',
  email: process.env.SUPER_ADMIN_EMAIL || 'codeofthoth@outlook.com',
  password: SUPER_ADMIN_PASSWORD,
  role: 'SUPER_ADMIN',
  isOwner: true,
  superAdminLocked: true,
  isActive: true,
};

const ADMIN = {
  name: 'PCL Admin',
  email: process.env.SEED_ADMIN_EMAIL || 'admin@pclsolutions.co.ke',
  password: ADMIN_PASSWORD,
  role: 'admin',
  isActive: true,
};

// ─── Departments ──────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Internet Distribution', slug: 'internet', description: 'ISP packages, hotspot sessions, network management' },
  { name: 'Web Development', slug: 'webdev', description: 'Website design, web apps, retainer contracts' },
  { name: 'PlayStation Arena', slug: 'playstation', description: 'Gaming sessions, tournaments, console management' },
  { name: 'Hardware Repair', slug: 'repair', description: 'Device repairs, job cards, parts inventory' },
  { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security audits, contracts, incident management' },
  { name: 'Gov Admin Assistance', slug: 'govadmin', description: 'e-Citizen, KRA, NTSA, document processing' },
];

// ─── Services ─────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    name: 'Internet Access (per hour)', category: 'internet', basePrice: 50, priceUnit: 'per hour',
  },
  {
    name: 'Internet Access (daily)', category: 'internet', basePrice: 200, priceUnit: 'per day',
  },
  {
    name: 'Printing (B&W per page)', category: 'printing', basePrice: 10, priceUnit: 'per page',
  },
  {
    name: 'Printing (Colour per page)', category: 'printing', basePrice: 30, priceUnit: 'per page',
  },
  {
    name: 'Gaming (per hour)', category: 'gaming', basePrice: 60, priceUnit: 'per hour',
  },
  {
    name: 'Website Design (Brochure)', category: 'web-dev', basePrice: 15000, priceUnit: 'per project', description: '5-page mobile-responsive brochure website.',
  },
  {
    name: 'MERN Web Application', category: 'web-dev', basePrice: 40000, priceUnit: 'per project', description: 'Full-stack custom web application.',
  },
  {
    name: 'E-Commerce Store', category: 'web-dev', basePrice: 35000, priceUnit: 'per project', description: 'Online store with M-Pesa checkout.',
  },
  {
    name: 'Cybersecurity Audit', category: 'cybersecurity', basePrice: 5000, priceUnit: 'per audit', description: 'Threat assessment and security recommendations.',
  },
  {
    name: 'Laptop Repair', category: 'hardware', basePrice: 500, priceUnit: 'per repair', description: 'Diagnosis, cleaning, OS reinstall, hardware fixes.',
  },
  {
    name: 'IT Support (monthly)', category: 'it-support', basePrice: 8000, priceUnit: 'per month', description: 'Ongoing IT support retainer for businesses.',
  },
  {
    name: 'Social Media Management', category: 'social-media', basePrice: 6000, priceUnit: 'per month', description: 'Content creation, posting, and audience growth.',
  },
  {
    name: 'Domain + Hosting (annual)', category: 'web-dev', basePrice: 3000, priceUnit: 'per year', description: 'Domain registration and web hosting package.',
  },
];

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    name: 'Refurbished Laptop Core i5', category: 'electronics', description: 'Refurbished Core i5 laptop, 8GB RAM, 256GB SSD. Tested, cleaned and ready to use.', shortDesc: 'Core i5, 8GB RAM, 256GB SSD', price: 45000, comparePrice: 55000, stock: 5, warranty: '3 months', featured: true, tags: ['laptop', 'refurbished', 'core i5'],
  },
  {
    name: 'Refurbished Laptop Core i3', category: 'electronics', description: 'Refurbished Core i3 laptop, 4GB RAM, 128GB SSD. Great for students and light work.', shortDesc: 'Core i3, 4GB RAM, 128GB SSD', price: 25000, comparePrice: 32000, stock: 8, warranty: '3 months', tags: ['laptop', 'refurbished', 'core i3', 'student'],
  },
  {
    name: 'Wireless Mouse & Keyboard Combo', category: 'accessories', description: 'Wireless mouse and keyboard combo, 2.4GHz, USB receiver included.', shortDesc: 'Wireless combo, USB receiver', price: 2500, stock: 20, tags: ['mouse', 'keyboard', 'wireless'],
  },
  {
    name: 'USB Flash Drive 32GB', category: 'accessories', description: 'USB 3.0 flash drive, 32GB storage, fast read/write speeds.', shortDesc: '32GB USB 3.0', price: 600, stock: 50, tags: ['usb', 'flash drive', 'storage'],
  },
  {
    name: 'HDMI Cable 1.8m', category: 'accessories', description: 'High-speed HDMI cable, 1.8 metres, supports 4K.', shortDesc: '1.8m, 4K support', price: 350, stock: 30, tags: ['hdmi', 'cable'],
  },
  {
    name: 'Laptop Bag 15.6"', category: 'accessories', description: 'Padded laptop bag fits up to 15.6 inch laptops. Multiple compartments, shoulder strap.', shortDesc: 'Fits up to 15.6", padded', price: 1200, stock: 15, tags: ['bag', 'laptop bag'],
  },
  {
    name: 'Antivirus Licence 1 Year', category: 'software', description: 'Standard antivirus licence for 1 device, 1 year subscription. Activation key delivered via email.', shortDesc: '1 device, 1 year, email delivery', price: 3000, isDigital: true, stock: 0, tags: ['antivirus', 'security', 'software'],
  },
  {
    name: 'Microsoft Office 2021 Licence', category: 'software', description: 'Genuine Microsoft Office 2021 Home & Student licence. Includes Word, Excel, PowerPoint.', shortDesc: 'Word, Excel, PowerPoint — lifetime', price: 6500, isDigital: true, stock: 0, tags: ['microsoft', 'office', 'software'],
  },
  {
    name: 'Starter Website Package', category: 'services', description: '5-page brochure website with domain and hosting for 1 year. Mobile responsive, contact form included.', shortDesc: '5 pages, hosting + domain 1yr', price: 15000, isDigital: true, stock: 0, featured: true, tags: ['website', 'web design', 'hosting'],
  },
  {
    name: 'Business Web Package', category: 'services', description: 'Up to 10-page business website with blog, gallery, contact form, SEO setup, and 1 year hosting.', shortDesc: '10 pages, blog, SEO, 1yr hosting', price: 25000, isDigital: true, stock: 0, featured: true, tags: ['website', 'business', 'seo'],
  },
  {
    name: 'Internet 3-Month Bundle', category: 'services', description: 'Prepaid 3-month internet access package. Unlimited browsing at our PCL Centre cybercafe.', shortDesc: '3 months unlimited cybercafe access', price: 2500, isDigital: true, stock: 0, tags: ['internet', 'bundle', 'cybercafe'],
  },
];

// ─── Pricing rules ────────────────────────────────────────────────────────────
const PRICING_RULES = [
  {
    service: 'Website Design', tier: 'basic', price: 15000, rushMultiplier: 1.30,
  },
  {
    service: 'Website Design', tier: 'standard', price: 25000, rushMultiplier: 1.30,
  },
  {
    service: 'Website Design', tier: 'premium', price: 45000, rushMultiplier: 1.30,
  },
  {
    service: 'MERN Web Application', tier: 'basic', price: 40000, rushMultiplier: 1.40,
  },
  {
    service: 'MERN Web Application', tier: 'standard', price: 80000, rushMultiplier: 1.40,
  },
  {
    service: 'MERN Web Application', tier: 'premium', price: 150000, rushMultiplier: 1.40,
  },
  {
    service: 'E-Commerce Store', tier: 'basic', price: 35000, rushMultiplier: 1.35,
  },
  {
    service: 'E-Commerce Store', tier: 'standard', price: 65000, rushMultiplier: 1.35,
  },
  {
    service: 'E-Commerce Store', tier: 'premium', price: 120000, rushMultiplier: 1.35,
  },
  {
    service: 'Cybersecurity Audit', tier: 'basic', price: 5000, rushMultiplier: 1.25,
  },
  {
    service: 'Cybersecurity Audit', tier: 'standard', price: 12000, rushMultiplier: 1.25,
  },
  {
    service: 'Cybersecurity Audit', tier: 'premium', price: 25000, rushMultiplier: 1.25,
  },
  {
    service: 'Hardware Repair', tier: 'basic', price: 500, rushMultiplier: 1.20,
  },
  {
    service: 'Hardware Repair', tier: 'standard', price: 1500, rushMultiplier: 1.20,
  },
  {
    service: 'Hardware Repair', tier: 'premium', price: 3500, rushMultiplier: 1.20,
  },
  {
    service: 'IT Support Monthly', tier: 'basic', price: 8000, rushMultiplier: 1.0,
  },
  {
    service: 'IT Support Monthly', tier: 'standard', price: 15000, rushMultiplier: 1.0,
  },
  {
    service: 'IT Support Monthly', tier: 'premium', price: 30000, rushMultiplier: 1.0,
  },
  {
    service: 'Social Media Management', tier: 'basic', price: 6000, rushMultiplier: 1.0,
  },
  {
    service: 'Social Media Management', tier: 'standard', price: 12000, rushMultiplier: 1.0,
  },
  {
    service: 'Social Media Management', tier: 'premium', price: 22000, rushMultiplier: 1.0,
  },
  {
    service: 'Domain + Hosting Annual', tier: 'basic', price: 3000, rushMultiplier: 1.0,
  },
  {
    service: 'Domain + Hosting Annual', tier: 'standard', price: 6000, rushMultiplier: 1.0,
  },
  {
    service: 'Domain + Hosting Annual', tier: 'premium', price: 12000, rushMultiplier: 1.0,
  },
];

// ─── Inline schemas ───────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'staff' },
  departmentSlug: String,
  isOwner: { type: Boolean, default: false },
  superAdminLocked: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const deptSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const serviceSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  basePrice: Number,
  priceUnit: String,
  isActive: { type: Boolean, default: true },
  totalRevenue: { type: Number, default: 0 },
  bookingCount: { type: Number, default: 0 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  category: String,
  description: String,
  shortDesc: String,
  price: Number,
  comparePrice: Number,
  images: { type: [String], default: [] },
  stock: { type: Number, default: 0 },
  isDigital: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  warranty: { type: String, default: 'No warranty' },
}, { timestamps: true });

const pricingRuleSchema = new mongoose.Schema({
  service: String,
  tier: String,
  price: Number,
  rushMultiplier: { type: Number, default: 1.0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
pricingRuleSchema.index({ service: 1, tier: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Department = mongoose.model('Department', deptSchema);
const Service = mongoose.model('Service', serviceSchema);
const Product = mongoose.model('Product', productSchema);
const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);

const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<')) {
    console.error('\n❌  MONGO_URI not set in .env\n'); process.exit(1);
  }

  console.log('\n🔌  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected.\n');

  // ── Super Admin ────────────────────────────────────────────────────────────
  const existingSuper = await User.findOne({ email: SUPER_ADMIN.email });
  if (existingSuper) {
    console.log(`ℹ️   Super Admin already exists: ${SUPER_ADMIN.email} — skipping.`);
  } else {
    const hashed = await bcrypt.hash(SUPER_ADMIN.password, 10);
    await User.create({ ...SUPER_ADMIN, password: hashed });
    console.log('🔒  Super Admin created:');
    console.log(`    Email   : ${SUPER_ADMIN.email}`);
    console.log(`    Password: ${SUPER_ADMIN.password}`);
    console.log('    Route   : http://localhost:3000/admin/super\n');
  }

  // ── Platform Admin ─────────────────────────────────────────────────────────
  const existingAdmin = await User.findOne({ email: ADMIN.email });
  if (existingAdmin) {
    console.log(`ℹ️   Admin already exists: ${ADMIN.email} — skipping.`);
  } else {
    const hashed = await bcrypt.hash(ADMIN.password, 10);
    await User.create({ ...ADMIN, password: hashed });
    console.log('👤  Platform Admin created:');
    console.log(`    Email   : ${ADMIN.email}`);
    console.log(`    Password: ${ADMIN.password}`);
    console.log('    Route   : http://localhost:3000/login\n');
  }

  // ── Departments ────────────────────────────────────────────────────────────
  let deptSeeded = 0;
  for (const d of DEPARTMENTS) {
    const exists = await Department.findOne({ slug: d.slug });
    if (!exists) { await Department.create(d); deptSeeded++; }
  }
  console.log(deptSeeded > 0 ? `🏢  ${deptSeeded} departments seeded.` : 'ℹ️   Departments already exist — skipping.');

  // ── Services ───────────────────────────────────────────────────────────────
  const svcCount = await Service.countDocuments();
  if (svcCount === 0) {
    await Service.insertMany(SERVICES);
    console.log(`🛠   ${SERVICES.length} services seeded.`);
  } else {
    console.log(`ℹ️   Services already exist (${svcCount}) — skipping.`);
  }

  // ── Products ───────────────────────────────────────────────────────────────
  const prdCount = await Product.countDocuments();
  if (prdCount === 0) {
    await Product.insertMany(PRODUCTS.map((p) => ({ ...p, slug: toSlug(p.name) })));
    console.log(`📦  ${PRODUCTS.length} products seeded.`);
  } else {
    console.log(`ℹ️   Products already exist (${prdCount}) — skipping.`);
  }

  // ── Pricing rules ──────────────────────────────────────────────────────────
  const ruleCount = await PricingRule.countDocuments();
  if (ruleCount === 0) {
    await PricingRule.insertMany(PRICING_RULES);
    console.log(`💰  ${PRICING_RULES.length} pricing rules seeded.`);
  } else {
    console.log(`ℹ️   Pricing rules already exist (${ruleCount}) — skipping.`);
  }

  console.log('\n✅  Seed complete.\n');
  console.log('══════════════════════════════════════════════════');
  console.log('  SUPER ADMIN');
  console.log('  URL      : http://localhost:3000/admin/super');
  console.log(`  Email    : ${SUPER_ADMIN.email}`);
  console.log(`  Password : ${SUPER_ADMIN.password}`);
  console.log('──────────────────────────────────────────────────');
  console.log('  PLATFORM ADMIN');
  console.log('  URL      : http://localhost:3000/login');
  console.log(`  Email    : ${ADMIN.email}`);
  console.log(`  Password : ${ADMIN.password}`);
  console.log('══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
