'use strict';

const fs       = require('fs');
const path     = require('path');
const Account  = require('../models/Account');
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const orderCtrl = require('../controllers/orderController');

const accountsFile = path.join(__dirname, '..', 'data', 'accounts.json');
const accountsBackup = path.join(__dirname, '..', 'data', 'accounts.json.bak');
const ordersFile = path.join(__dirname, '..', 'data', 'orders.json');
const ordersBackup = path.join(__dirname, '..', 'data', 'orders.json.bak');
const productsFile = path.join(__dirname, '..', 'data', 'products.json');
const productsBackup = path.join(__dirname, '..', 'data', 'products.json.bak');

function mockReq(body = {}, params = {}, session = {}) {
  return { body, params, session };
}

function mockRes() {
  const res = {};
  res.json = jest.fn((data) => res);
  res.status = jest.fn(() => res);
  return res;
}

beforeAll(() => {
  if (fs.existsSync(accountsFile)) fs.copyFileSync(accountsFile, accountsBackup);
  if (fs.existsSync(ordersFile)) fs.copyFileSync(ordersFile, ordersBackup);
  if (fs.existsSync(productsFile)) fs.copyFileSync(productsFile, productsBackup);
});

afterAll(() => {
  if (fs.existsSync(accountsBackup)) {
    fs.copyFileSync(accountsBackup, accountsFile);
    fs.unlinkSync(accountsBackup);
  }
  if (fs.existsSync(ordersBackup)) {
    fs.copyFileSync(ordersBackup, ordersFile);
    fs.unlinkSync(ordersBackup);
  }
  if (fs.existsSync(productsBackup)) {
    fs.copyFileSync(productsBackup, productsFile);
    fs.unlinkSync(productsBackup);
  }
});

beforeEach(() => {
  fs.writeFileSync(accountsFile, JSON.stringify([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
      role: 'customer',
      passwordHash: 'hash123',
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'jane@example.com',
      address: '456 Oak Ave',
      role: 'customer',
      passwordHash: 'hash456',
    },
    {
      id: 100,
      name: 'Staff User',
      email: 'staff@example.com',
      address: '789 Staff Ln',
      role: 'staff',
      passwordHash: 'staffhash',
    },
  ], null, 2));

  fs.writeFileSync(productsFile, JSON.stringify([
    { id: 1, name: 'Product 1', price: 10, category: 'Test', type: 'Type1' },
    { id: 2, name: 'Product 2', price: 20, category: 'Test', type: 'Type2' },
    { id: 3, name: 'Product 3', price: 15, category: 'Test', type: 'Type1' },
  ], null, 2));

  fs.writeFileSync(ordersFile, JSON.stringify([
    {
      id: 'ORD-001',
      userId: 1,
      email: 'john@example.com',
      name: 'John Doe',
      address: '123 Main St',
      items: [{ productId: 1, name: 'Product 1', price: 10, qty: 1 }],
      total: 11,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
  ], null, 2));
});

afterEach(() => {
  fs.writeFileSync(accountsFile, '[]');
  fs.writeFileSync(ordersFile, '[]');
  fs.writeFileSync(productsFile, '[]');
});

describe('OrderController', () => {
  describe('listOrders', () => {
    test('returns all orders with stats', () => {
      const req = mockReq();
      const res = mockRes();
      orderCtrl.listOrders(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          totalRevenue: expect.any(Number),
        })
      );
    });
  });

  describe('getOrder', () => {
    test('returns order by id', () => {
      const req = mockReq({}, { orderId: 'ORD-001' });
      const res = mockRes();
      orderCtrl.getOrder(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.objectContaining({ id: 'ORD-001' }),
        })
      );
    });

    test('returns 404 for non-existent order', () => {
      const req = mockReq({}, { orderId: 'ORD-999' });
      const res = mockRes();
      orderCtrl.getOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createOrder', () => {
    test('creates order for existing customer by ID', () => {
      const req = mockReq(
        {
          customerId: 1,
          items: [
            { productId: 1, qty: 2 },
            { productId: 2, qty: 1 },
          ],
          name: 'John Doe',
          address: '123 Main St',
        },
        {},
        { user: { id: 100 } }
      );
      const res = mockRes();
      orderCtrl.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.objectContaining({
            userId: 1,
            items: expect.any(Array),
            total: expect.any(Number),
          }),
        })
      );

      // Verify order is saved
      expect(Order.getAll().length).toBeGreaterThan(0);
    });

    test('creates order for customer by email', () => {
      const req = mockReq(
        {
          email: 'jane@example.com',
          items: [{ productId: 1, qty: 1 }],
          name: 'Jane Doe',
          address: '456 Oak Ave',
        },
        {},
        { user: { id: 100 } }
      );
      const res = mockRes();
      orderCtrl.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.objectContaining({
            userId: 2,
            email: 'jane@example.com',
          }),
        })
      );
    });

    test('returns 400 if no customer ID or email provided', () => {
      const req = mockReq(
        {
          items: [{ productId: 1, qty: 1 }],
          name: 'Test',
          address: 'Test',
        },
        {},
        { user: { id: 100 } }
      );
      const res = mockRes();
      orderCtrl.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 if items is empty', () => {
      const req = mockReq(
        {
          customerId: 1,
          items: [],
          name: 'Test',
          address: 'Test',
        },
        {},
        { user: { id: 100 } }
      );
      const res = mockRes();
      orderCtrl.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 if product not found', () => {
      const req = mockReq(
        {
          customerId: 1,
          items: [{ productId: 999, qty: 1 }],
          name: 'Test',
          address: 'Test',
        },
        {},
        { user: { id: 100 } }
      );
      const res = mockRes();
      orderCtrl.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('calculates correct total with tax', () => {
      const req = mockReq(
        {
          customerId: 1,
          items: [
            { productId: 1, qty: 2 }, // 2 * 10 = 20
            { productId: 2, qty: 1 }, // 1 * 20 = 20
          ],
          name: 'John Doe',
          address: '123 Main St',
        },
        {},
        { user: { id: 100 } }
      );
      const res = mockRes();
      orderCtrl.createOrder(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.objectContaining({
            subtotal: 40, // 20 + 20
            tax: 4,       // 40 * 0.1
            total: 44,    // 40 + 4
          }),
        })
      );
    });
  });

  describe('updateOrderStatus', () => {
    test('updates order status successfully', () => {
      const req = mockReq({ status: 'shipped' }, { orderId: 'ORD-001' });
      const res = mockRes();
      orderCtrl.updateOrderStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.objectContaining({
            status: 'shipped',
          }),
        })
      );

      // Verify update is saved
      const order = Order.getById('ORD-001');
      expect(order.status).toBe('shipped');
    });

    test('returns 400 for invalid status', () => {
      const req = mockReq({ status: 'invalid-status' }, { orderId: 'ORD-001' });
      const res = mockRes();
      orderCtrl.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 for non-existent order', () => {
      const req = mockReq({ status: 'shipped' }, { orderId: 'ORD-999' });
      const res = mockRes();
      orderCtrl.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('allows valid statuses', () => {
      const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      validStatuses.forEach(status => {
        const req = mockReq({ status }, { orderId: 'ORD-001' });
        const res = mockRes();
        orderCtrl.updateOrderStatus(req, res);
        expect(res.json).toHaveBeenCalled();
      });
    });
  });

  describe('listCustomers', () => {
    test('returns list of customers only', () => {
      const req = mockReq();
      const res = mockRes();
      orderCtrl.listCustomers(req, res);

      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.count).toBe(2); // Only 2 customers, 1 staff
      expect(call.customers.every(c => c.role !== 'staff')).toBe(true);
    });
  });

  describe('getCustomer', () => {
    test('returns customer details with orders', () => {
      const req = mockReq({}, { customerId: 1 });
      const res = mockRes();
      orderCtrl.getCustomer(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          customer: expect.objectContaining({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
          }),
          orders: expect.any(Array),
        })
      );
    });

    test('returns 404 for non-existent customer', () => {
      const req = mockReq({}, { customerId: 999 });
      const res = mockRes();
      orderCtrl.getCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getStats', () => {
    test('returns order statistics', () => {
      const req = mockReq();
      const res = mockRes();
      orderCtrl.getStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          stats: expect.objectContaining({
            totalOrders: expect.any(Number),
            totalRevenue: expect.any(Number),
            totalCustomers: expect.any(Number),
            ordersByStatus: expect.any(Object),
          }),
        })
      );
    });
  });
});
