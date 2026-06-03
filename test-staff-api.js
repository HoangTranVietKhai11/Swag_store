#!/usr/bin/env node
'use strict';

/**
 * Script test API endpoints cho staff
 * Run: node test-staff-api.js
 */

const http = require('http');
const Account = require('./models/Account');
const Product = require('./models/Product');

// Setup test data
function setupTestData() {
  console.log('📦 Setting up test data...\n');

  // Tạo staff account nếu chưa có
  try {
    let staff = Account.findByEmail('teststaff@example.com');
    if (!staff) {
      staff = Account.add({
        name: 'Test Staff',
        email: 'teststaff@example.com',
        password: 'testpass123',
        address: '123 Staff St',
      });
      Account.update(staff.id, { role: 'staff' });
      console.log(`✅ Created staff account: teststaff@example.com / testpass123\n`);
    } else {
      console.log(`✅ Staff account already exists: teststaff@example.com\n`);
    }
  } catch (err) {
    console.error('Staff account might already exist');
  }

  // Tạo customer account nếu chưa có
  try {
    let customer = Account.findByEmail('testcustomer@example.com');
    if (!customer) {
      customer = Account.add({
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        password: 'custpass123',
        address: '456 Customer Ave',
      });
      console.log(`✅ Created customer account: testcustomer@example.com / custpass123\n`);
    }
  } catch (err) {
    console.error('Customer account might already exist');
  }

  // Verify products exist
  const products = Product.getAll();
  console.log(`✅ Products available: ${products.length}`);
  if (products.length > 0) {
    console.log(`   Example: ID=${products[0].id}, Name="${products[0].name}", Price=$${products[0].price}\n`);
  }
}

// Display test commands
function displayTestCommands() {
  console.log('\n' + '='.repeat(70));
  console.log('📡 API TEST COMMANDS');
  console.log('='.repeat(70) + '\n');

  const commands = [
    {
      description: 'Start the server',
      command: 'npm start',
    },
    {
      description: 'Then test these endpoints (in another terminal):',
      command: '',
    },
    {
      description: '1. LOGIN AS STAFF',
      command: `curl -X POST http://localhost:3000/login \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "email=teststaff@example.com&password=testpass123"`,
    },
    {
      description: '2. LIST ALL PRODUCTS (staff only)',
      command: `curl http://localhost:3000/staff/products`,
    },
    {
      description: '3. CREATE NEW PRODUCT',
      command: `curl -X POST http://localhost:3000/staff/products \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Test Product",
    "price": 49.99,
    "category": "Electronics",
    "type": "Gadget",
    "desc": "A test product",
    "badge": "New"
  }'`,
    },
    {
      description: '4. LIST ALL CUSTOMERS',
      command: `curl http://localhost:3000/staff/customers`,
    },
    {
      description: '5. CREATE ORDER FOR CUSTOMER',
      command: `curl -X POST http://localhost:3000/staff/orders \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "testcustomer@example.com",
    "items": [
      { "productId": 1, "qty": 2 },
      { "productId": 2, "qty": 1 }
    ],
    "name": "Test Customer",
    "address": "456 Customer Ave"
  }'`,
    },
    {
      description: '6. LIST ALL ORDERS',
      command: `curl http://localhost:3000/staff/orders`,
    },
    {
      description: '7. VIEW STATISTICS',
      command: `curl http://localhost:3000/staff/stats`,
    },
  ];

  commands.forEach((cmd, idx) => {
    console.log(`${cmd.description}`);
    if (cmd.command) {
      console.log(`\n${cmd.command}\n`);
    } else {
      console.log();
    }
  });

  console.log('='.repeat(70));
  console.log('\n💡 NOTE: You may need to set session cookies for staff access.');
  console.log('   In a real client, cookies are handled automatically.\n');
}

// Main execution
console.log('\n' + '='.repeat(70));
console.log('🛠️  SWAGSTORE - STAFF SYSTEM TEST HELPER');
console.log('='.repeat(70) + '\n');

setupTestData();
displayTestCommands();

console.log('✨ Test setup complete! You can now start the server and test the API.\n');
