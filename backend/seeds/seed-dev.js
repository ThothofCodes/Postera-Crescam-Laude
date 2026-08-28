/**
 * Development Seed Script
 * 
 * Creates realistic test data for local development.
 * Includes users, products, orders, tickets, and chat messages.
 * 
 * Usage: node seeds/seed-dev.js
 * 
 * Environment Variables:
 *   MONGO_URI - MongoDB connection string
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Users ──────────────────────────────────────────────────────────────────
const USERS = [
  {
    name: 'Thoth of Codes',
    email: 'codeofthoth@outlook.com',
    password: 'SuperAdmin@2026',
    role: 'SUPER_ADMIN',
    isOwner: true,
    superAdminLocked: true,
    isActive: true,
  },
  {
    name: 'Ruai Tech Admin',
    email: 'admin@ruaitechsolutions.co.ke',
    password: 'Admin@2026',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'John Doe',
    email: 'john@ruaitechsolutions.co.ke',
    password: 'Staff@2026',
    role: 'DEPT_HEAD_OWNER',
    departmentSlug: 'internet',
    isActive: true,
  },
  {
    name: 'Jane Smith',
    email: 'jane@ruaitechsolutions.co.ke',
    password: 'Staff@2026',
    role: 'DEPT_HEAD_OWNER',
    departmentSlug: 'webdev',
    isActive: true,
  },
  {
    name: 'Mike Johnson',
    email: 'mike@ruaitechsolutions.co.ke',
    password: 'Staff@2026',
    role: 'DEPT_HEAD_OWNER',
    departmentSlug: 'repair',
    isActive: true,
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@ruaitechsolutions.co.ke',
    password: 'Staff@2026',
    role: 'DEPT_HEAD_OWNER',
    departmentSlug: 'cybersecurity',
    isActive: true,
  },
  {
    name: 'David Brown',
    email: 'david@ruaitechsolutions.co.ke',
    password: 'Staff@2026',
    role: 'DEPT_HEAD_OWNER',
    departmentSlug: 'playstation',
    isActive: true,
  },
  {
    name: 'Emily Davis',
    email: 'emily@ruaitechsolutions.co.ke',
    password: 'Staff@2026',
    role: 'DEPT_HEAD_OWNER',
    departmentSlug: 'govadmin',
    isActive: true,
  },
  {
    name: 'Test Staff',
    email: 'staff@test.com',
    password: 'Staff@2026',
    role: 'STAFF',
    departmentSlug: 'repair',
    isActive: true,
  },
  {
    name: 'Customer One',
    email: 'customer1@test.com',
    password: 'Customer@2026',
    role: 'client',
    isActive: true,
  },
  {
    name: 'Customer Two',
    email: 'customer2@test.com',
    password: 'Customer@2026',
    role: 'client',
    isActive: true,
  },
];

// ─── Departments ────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Internet Distribution', slug: 'internet', description: 'ISP packages, hotspot sessions, network management' },
  { name: 'Web Development', slug: 'webdev', description: 'Website design, web apps, retainer contracts' },
  { name: 'PlayStation Arena', slug: 'playstation', description: 'Gaming sessions, tournaments, console management' },
  { name: 'Hardware Repair', slug: 'repair', description: 'Device repairs, job cards, parts inventory' },
  { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security audits, contracts, incident management' },
  { name: 'Gov Admin Assistance', slug: 'govadmin', description: 'e-Citizen, KRA, NTSA, document processing' },
];

// ─── Products ───────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    name: 'Refurbished Laptop Core i5',
    slug: 'refurbished-laptop-core-i5',
    category: 'electronics',
    description: 'Refurbished Core i5 laptop, 8GB RAM, 256GB SSD. Tested, cleaned and ready to use.',
    shortDesc: 'Core i5, 8GB RAM, 256GB SSD',
    price: 45000,
    comparePrice: 55000,
    stock: 5,
    warranty: '3 months',
    featured: true,
    tags: ['laptop', 'refurbished', 'core i5'],
    rating: 4.5,
    reviewCount: 12,
    soldCount: 23,
  },
  {
    name: 'Refurbished Laptop Core i3',
    slug: 'refurbished-laptop-core-i3',
    category: 'electronics',
    description: 'Refurbished Core i3 laptop, 4GB RAM, 128GB SSD. Great for students and light work.',
    shortDesc: 'Core i3, 4GB RAM, 128GB SSD',
    price: 25000,
    comparePrice: 32000,
    stock: 8,
    warranty: '3 months',
    tags: ['laptop', 'refurbished', 'core i3', 'student'],
    rating: 4.2,
    reviewCount: 8,
    soldCount: 15,
  },
  {
    name: 'Wireless Mouse & Keyboard Combo',
    slug: 'wireless-mouse-keyboard-combo',
    category: 'accessories',
    description: 'Wireless mouse and keyboard combo, 2.4GHz, USB receiver included.',
    shortDesc: 'Wireless combo, USB receiver',
    price: 2500,
    stock: 20,
    tags: ['mouse', 'keyboard', 'wireless'],
    rating: 4.0,
    reviewCount: 5,
    soldCount: 42,
  },
  {
    name: 'USB Flash Drive 32GB',
    slug: 'usb-flash-drive-32gb',
    category: 'accessories',
    description: 'USB 3.0 flash drive, 32GB storage, fast read/write speeds.',
    shortDesc: '32GB USB 3.0',
    price: 600,
    stock: 50,
    tags: ['usb', 'flash drive', 'storage'],
    rating: 4.3,
    reviewCount: 15,
    soldCount: 89,
  },
  {
    name: 'HDMI Cable 1.8m',
    slug: 'hdmi-cable-18m',
    category: 'accessories',
    description: 'High-speed HDMI cable, 1.8 metres, supports 4K.',
    shortDesc: '1.8m, 4K support',
    price: 350,
    stock: 30,
    tags: ['hdmi', 'cable'],
    rating: 4.1,
    reviewCount: 7,
    soldCount: 56,
  },
  {
    name: 'Laptop Bag 15.6"',
    slug: 'laptop-bag-156',
    category: 'accessories',
    description: 'Padded laptop bag fits up to 15.6 inch laptops. Multiple compartments, shoulder strap.',
    shortDesc: 'Fits up to 15.6", padded',
    price: 1200,
    stock: 15,
    tags: ['bag', 'laptop bag'],
    rating: 4.4,
    reviewCount: 9,
    soldCount: 34,
  },
  {
    name: 'Antivirus Licence 1 Year',
    slug: 'antivirus-licence-1-year',
    category: 'software',
    description: 'Standard antivirus licence for 1 device, 1 year subscription. Activation key delivered via email.',
    shortDesc: '1 device, 1 year, email delivery',
    price: 3000,
    isDigital: true,
    stock: 0,
    tags: ['antivirus', 'security', 'software'],
    rating: 4.6,
    reviewCount: 22,
    soldCount: 67,
  },
  {
    name: 'Microsoft Office 2021 Licence',
    slug: 'microsoft-office-2021-licence',
    category: 'software',
    description: 'Genuine Microsoft Office 2021 Home & Student licence. Includes Word, Excel, PowerPoint.',
    shortDesc: 'Word, Excel, PowerPoint — lifetime',
    price: 6500,
    isDigital: true,
    stock: 0,
    tags: ['microsoft', 'office', 'software'],
    rating: 4.7,
    reviewCount: 31,
    soldCount: 89,
  },
  {
    name: 'Starter Website Package',
    slug: 'starter-website-package',
    category: 'services',
    description: '5-page brochure website with domain and hosting for 1 year. Mobile responsive, contact form included.',
    shortDesc: '5 pages, hosting + domain 1yr',
    price: 15000,
    isDigital: true,
    stock: 0,
    featured: true,
    tags: ['website', 'web design', 'hosting'],
    rating: 4.8,
    reviewCount: 18,
    soldCount: 45,
  },
  {
    name: 'Business Web Package',
    slug: 'business-web-package',
    category: 'services',
    description: 'Up to 10-page business website with blog, gallery, contact form, SEO setup, and 1 year hosting.',
    shortDesc: '10 pages, blog, SEO, 1yr hosting',
    price: 25000,
    isDigital: true,
    stock: 0,
    featured: true,
    tags: ['website', 'business', 'seo'],
    rating: 4.9,
    reviewCount: 24,
    soldCount: 32,
  },
];

// ─── Services ───────────────────────────────────────────────────────────────
const SERVICES = [
  { name: 'Internet Access (per hour)', category: 'internet', basePrice: 50, priceUnit: 'per hour' },
  { name: 'Internet Access (daily)', category: 'internet', basePrice: 200, priceUnit: 'per day' },
  { name: 'Printing (B&W per page)', category: 'printing', basePrice: 10, priceUnit: 'per page' },
  { name: 'Printing (Colour per page)', category: 'printing', basePrice: 30, priceUnit: 'per page' },
  { name: 'Gaming (per hour)', category: 'gaming', basePrice: 60, priceUnit: 'per hour' },
  { name: 'Website Design (Brochure)', category: 'web-dev', basePrice: 15000, priceUnit: 'per project', description: '5-page mobile-responsive brochure website.' },
  { name: 'MERN Web Application', category: 'web-dev', basePrice: 40000, priceUnit: 'per project', description: 'Full-stack custom web application.' },
  { name: 'E-Commerce Store', category: 'web-dev', basePrice: 35000, priceUnit: 'per project', description: 'Online store with M-Pesa checkout.' },
  { name: 'Cybersecurity Audit', category: 'cybersecurity', basePrice: 5000, priceUnit: 'per audit', description: 'Threat assessment and security recommendations.' },
  { name: 'Laptop Repair', category: 'hardware', basePrice: 500, priceUnit: 'per repair', description: 'Diagnosis, cleaning, OS reinstall, hardware fixes.' },
];

// ─── Orders ─────────────────────────────────────────────────────────────────
const generateOrders = (userIds) => [
  {
    orderNumber: 'ORD-DEV-001',
    userId: userIds[0],
    items: [
      { product: null, name: 'Refurbished Laptop Core i5', quantity: 1, price: 45000 },
    ],
    subtotal: 45000,
    shipping: 500,
    total: 45500,
    status: 'delivered',
    payment: { method: 'mpesa', status: 'completed', transactionId: 'MPESA-DEV-001' },
    shippingAddress: { street: '123 Tech Street', city: 'Nairobi', country: 'Kenya' },
  },
  {
    orderNumber: 'ORD-DEV-002',
    userId: userIds[0],
    items: [
      { product: null, name: 'Wireless Mouse & Keyboard Combo', quantity: 2, price: 2500 },
      { product: null, name: 'USB Flash Drive 32GB', quantity: 3, price: 600 },
    ],
    subtotal: 6800,
    shipping: 300,
    total: 7100,
    status: 'shipped',
    payment: { method: 'card', status: 'completed', transactionId: 'CARD-DEV-002' },
    shippingAddress: { street: '456 Business Ave', city: 'Mombasa', country: 'Kenya' },
  },
  {
    orderNumber: 'ORD-DEV-003',
    userId: userIds[1],
    items: [
      { product: null, name: 'Antivirus Licence 1 Year', quantity: 1, price: 3000 },
    ],
    subtotal: 3000,
    shipping: 0,
    total: 3000,
    status: 'processing',
    payment: { method: 'mpesa', status: 'completed', transactionId: 'MPESA-DEV-003' },
    shippingAddress: { street: '789 Digital Lane', city: 'Kisumu', country: 'Kenya' },
  },
];

// ─── Tickets ────────────────────────────────────────────────────────────────
const generateTickets = (userIds) => [
  {
    ticketId: 'RTS-DEV-TKT-001',
    title: 'Laptop screen flickering',
    description: 'Customer reports screen flickering on refurbished laptop purchased 2 weeks ago.',
    category: 'HARDWARE_REPAIR',
    priority: 'HIGH',
    status: 'OPEN',
    customerEmail: 'customer1@test.com',
    customerName: 'Customer One',
    customerPhone: '+254700000001',
    slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
  },
  {
    ticketId: 'RTS-DEV-TKT-002',
    title: 'Website not loading',
    description: 'Business website has been down for 2 hours. Error 502 Bad Gateway.',
    category: 'WEB_DEVELOPMENT',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    assignedTo: userIds[2],
    customerEmail: 'customer2@test.com',
    customerName: 'Customer Two',
    customerPhone: '+254700000002',
    slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
  },
  {
    ticketId: 'RTS-DEV-TKT-003',
    title: 'Internet connection slow',
    description: 'Internet speed dropped to below 1 Mbps since morning.',
    category: 'INTERNET',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    assignedTo: userIds[1],
    resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    customerEmail: 'customer1@test.com',
    customerName: 'Customer One',
    customerPhone: '+254700000001',
  },
];

// ─── Chat Messages ──────────────────────────────────────────────────────────
const generateChatMessages = (userIds) => [
  {
    sender: userIds[0],
    senderName: 'Customer One',
    recipient: userIds[2],
    recipientName: 'Mike Johnson',
    message: 'Hi, I need help with my laptop repair.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
  {
    sender: userIds[2],
    senderName: 'Mike Johnson',
    recipient: userIds[0],
    recipientName: 'Customer One',
    message: 'Hello! I can see you have an open ticket. Let me check the status.',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    read: true,
  },
  {
    sender: userIds[0],
    senderName: 'Customer One',
    recipient: userIds[2],
    recipientName: 'Mike Johnson',
    message: 'Thank you! When will it be ready?',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    read: false,
  },
];

// ─── Main Seed Function ─────────────────────────────────────────────────────
async function seed() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<')) {
    console.error('\n❌  MONGO_URI not set in .env\n');
    process.exit(1);
  }

  console.log('\n🔌  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected.\n');

  console.log('🌱  Seeding development database...\n');

  // Clear existing data
  console.log('🗑️   Clearing existing data...');
  await mongoose.connection.db.dropDatabase();
  console.log('✅  Database cleared.\n');

  // Create users
  console.log('👤  Creating users...');
  const userIds = [];
  for (const userData of USERS) {
    const hashed = await bcrypt.hash(userData.password, 10);
    const user = await mongoose.connection.db.collection('users').insertOne({
      ...userData,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userIds.push(user.insertedId);
    console.log(`   ✅ ${userData.name} (${userData.email})`);
  }
  console.log('');

  // Create departments
  console.log('🏢  Creating departments...');
  for (const dept of DEPARTMENTS) {
    await mongoose.connection.db.collection('departments').insertOne({
      ...dept,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`   ✅ ${dept.name}`);
  }
  console.log('');

  // Create products
  console.log('📦  Creating products...');
  for (const product of PRODUCTS) {
    await mongoose.connection.db.collection('products').insertOne({
      ...product,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`   ✅ ${product.name}`);
  }
  console.log('');

  // Create services
  console.log('🛠   Creating services...');
  for (const service of SERVICES) {
    await mongoose.connection.db.collection('services').insertOne({
      ...service,
      isActive: true,
      totalRevenue: 0,
      bookingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`   ✅ ${service.name}`);
  }
  console.log('');

  // Create orders
  console.log('🛒  Creating orders...');
  const orders = generateOrders(userIds);
  for (const order of orders) {
    await mongoose.connection.db.collection('orders').insertOne({
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`   ✅ ${order.orderNumber}`);
  }
  console.log('');

  // Create tickets
  console.log('🎫  Creating tickets...');
  const tickets = generateTickets(userIds);
  for (const ticket of tickets) {
    await mongoose.connection.db.collection('tickets').insertOne({
      ...ticket,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`   ✅ ${ticket.ticketId}`);
  }
  console.log('');

  // Create chat messages
  console.log('💬  Creating chat messages...');
  const messages = generateChatMessages(userIds);
  for (const msg of messages) {
    await mongoose.connection.db.collection('chatmessages').insertOne({
      ...msg,
      createdAt: new Date(),
    });
    console.log(`   ✅ Message from ${msg.senderName}`);
  }
  console.log('');

  // Summary
  console.log('══════════════════════════════════════════════════');
  console.log('  Development Database Seeded Successfully!');
  console.log('══════════════════════════════════════════════════');
  console.log('');
  console.log('  Users Created:');
  console.log('    SUPER_ADMIN: codeofthoth@outlook.com / SuperAdmin@2026');
  console.log('    Admin:       admin@ruaitechsolutions.co.ke / Admin@2026');
  console.log('    Staff:       staff@test.com / Staff@2026');
  console.log('    Customer:    customer1@test.com / Customer@2026');
  console.log('');
  console.log('  Test Data:');
  console.log('    - 10 Products');
  console.log('    - 10 Services');
  console.log('    - 3 Orders');
  console.log('    - 3 Tickets');
  console.log('    - 3 Chat Messages');
  console.log('');
  console.log('══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
