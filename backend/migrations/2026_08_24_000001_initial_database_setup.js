/**
 * Migration: Initial database setup
 * Created: 2026-08-24
 */

module.exports = {
  async up(db) {
    console.log('   Running initial database setup...');

    // Create indexes for Users collection
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ departmentSlug: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    console.log('   ✅ Users indexes created');

    // Create indexes for Products collection
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ isActive: 1, featured: -1 });
    await db.collection('products').createIndex({ price: 1 });
    await db.collection('products').createIndex({ name: 'text', description: 'text', tags: 'text' });
    console.log('   ✅ Products indexes created');

    // Create indexes for Orders collection
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
    await db.collection('orders').createIndex({ userId: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('orders').createIndex({ 'payment.method': 1, 'payment.status': 1 });
    console.log('   ✅ Orders indexes created');

    // Create indexes for Tickets collection
    await db.collection('tickets').createIndex({ ticketId: 1 }, { unique: true });
    await db.collection('tickets').createIndex({ status: 1 });
    await db.collection('tickets').createIndex({ priority: 1 });
    await db.collection('tickets').createIndex({ assignedTo: 1 });
    await db.collection('tickets').createIndex({ createdAt: -1 });
    await db.collection('tickets').createIndex({ slaDeadline: 1 }, { expireAfterSeconds: 0 });
    console.log('   ✅ Tickets indexes created');

    // Create indexes for ChatMessages collection
    await db.collection('chatmessages').createIndex({ conversationId: 1, createdAt: -1 });
    await db.collection('chatmessages').createIndex({ sender: 1 });
    await db.collection('chatmessages').createIndex({ recipient: 1 });
    console.log('   ✅ ChatMessages indexes created');

    // Create indexes for Departments collection
    await db.collection('departments').createIndex({ slug: 1 }, { unique: true });
    await db.collection('departments').createIndex({ isActive: 1 });
    console.log('   ✅ Departments indexes created');

    // Create indexes for Services collection
    await db.collection('services').createIndex({ category: 1 });
    await db.collection('services').createIndex({ isActive: 1 });
    console.log('   ✅ Services indexes created');

    // Create indexes for Invoices collection
    await db.collection('invoices').createIndex({ invoiceNumber: 1 }, { unique: true });
    await db.collection('invoices').createIndex({ userId: 1 });
    await db.collection('invoices').createIndex({ status: 1 });
    await db.collection('invoices').createIndex({ dueDate: 1 });
    console.log('   ✅ Invoices indexes created');

    // Create indexes for Consultations collection
    await db.collection('consultations').createIndex({ userId: 1 });
    await db.collection('consultations').createIndex({ status: 1 });
    await db.collection('consultations').createIndex({ scheduledAt: 1 });
    console.log('   ✅ Consultations indexes created');

    // Create indexes for AuditLog collection
    await db.collection('auditlogs').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('auditlogs').createIndex({ action: 1 });
    await db.collection('auditlogs').createIndex({ resource: 1, resourceId: 1 });
    console.log('   ✅ AuditLog indexes created');

    // Create indexes for ActiveSessions collection
    await db.collection('activesessions').createIndex({ userId: 1 });
    await db.collection('activesessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('   ✅ ActiveSessions indexes created');

    // Create indexes for RegisteredDevices collection
    await db.collection('registereddevices').createIndex({ userId: 1 });
    await db.collection('registereddevices').createIndex({ fingerprintHash: 1 });
    console.log('   ✅ RegisteredDevices indexes created');

    // Create indexes for Inventory collection
    await db.collection('inventories').createIndex({ productId: 1 });
    await db.collection('inventories').createIndex({ sku: 1 }, { unique: true });
    await db.collection('inventories').createIndex({ quantity: 1 });
    console.log('   ✅ Inventory indexes created');

    // Create indexes for JobCards collection
    await db.collection('jobcards').createIndex({ jobCardNumber: 1 }, { unique: true });
    await db.collection('jobcards').createIndex({ status: 1 });
    await db.collection('jobcards').createIndex({ assignedTo: 1 });
    console.log('   ✅ JobCards indexes created');

    console.log('   ✅ Initial database setup complete');
  },

  async down(db) {
    console.log('   Rolling back initial database setup...');

    // Drop all created indexes (except _id)
    const collections = [
      'users', 'products', 'orders', 'tickets', 'chatmessages',
      'departments', 'services', 'invoices', 'consultations',
      'auditlogs', 'activesessions', 'registereddevices',
      'inventories', 'jobcards'
    ];

    for (const collName of collections) {
      try {
        const indexes = await db.collection(collName).listIndexes().toArray();
        for (const index of indexes) {
          if (index.name !== '_id_') {
            await db.collection(collName).dropIndex(index.name);
          }
        }
        console.log(`   ✅ ${collName} indexes dropped`);
      } catch (error) {
        console.log(`   ⚠️  ${collName}: ${error.message}`);
      }
    }

    console.log('   ✅ Initial database setup rolled back');
  },
};
