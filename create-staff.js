#!/usr/bin/env node
'use strict';

/**
 * Helper script để tạo staff account
 * Usage: node create-staff.js "Staff Name" "staff@email.com" "password" "address"
 */

const Account = require('./models/Account');

function createStaffAccount(name, email, password, address) {
  try {
    // Create account
    const account = Account.add({ name, email, password, address });
    console.log('✅ Account created:', { id: account.id, email: account.email });

    // Update role to staff
    const updated = Account.update(account.id, { role: 'staff' });
    console.log('✅ Role updated to staff');
    console.log('\nStaff Account Details:');
    console.log(`  ID:       ${updated.id}`);
    console.log(`  Name:     ${updated.name}`);
    console.log(`  Email:    ${updated.email}`);
    console.log(`  Address:  ${updated.address}`);
    console.log(`  Role:     ${updated.role}`);
    console.log(`  Created:  ${updated.createdAt}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('Usage: node create-staff.js "Name" "email@example.com" "password" "address"');
  console.log('\nExample:');
  console.log('  node create-staff.js "John Staff" "staff@example.com" "secure123" "123 Staff St"');
  process.exit(1);
}

const [name, email, password, address] = args;
createStaffAccount(name, email, password, address);
