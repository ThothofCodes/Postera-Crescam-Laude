// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Script to remove all non-super-admin users
// Usage: node scripts/removeNonSuperAdmins.js

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pcl_db';

async function removeNonSuperAdmins() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users that are not SUPER_ADMIN
    const usersToRemove = await User.find({ role: { $ne: 'SUPER_ADMIN' } });
    console.log(`Found ${usersToRemove.length} non-super-admin users to remove`);

    if (usersToRemove.length === 0) {
      console.log('No users to remove');
      return;
    }

    // Log users that will be removed
    usersToRemove.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Remove all non-super-admin users
    const result = await User.deleteMany({ role: { $ne: 'SUPER_ADMIN' } });
    console.log(`\nRemoved ${result.deletedCount} users`);

    // Verify remaining users
    const remainingUsers = await User.find({});
    console.log(`\nRemaining users (${remainingUsers.length}):`);
    remainingUsers.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  removeNonSuperAdmins();
}

module.exports = removeNonSuperAdmins;
