'use strict';

const Order = require('../models/Order');
const Account = require('../models/Account');
const Product = require('../models/Product');

// GET /staff/orders - list all orders
exports.listOrders = (req, res) => {
  const orders = Order.getAll();
  res.json({
    success: true,
    orders,
    count: orders.length,
    totalRevenue: Order.totalRevenue(),
  });
};

// GET /staff/orders/:orderId - get order details
exports.getOrder = (req, res) => {
  const order = Order.getById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ success: true, order });
};

// POST /staff/orders - staff creates order for customer
exports.createOrder = (req, res) => {
  const { customerId, items, name, address, email } = req.body;

  // Validate input
  if (!customerId && !email) {
    return res.status(400).json({ error: 'Customer ID or email is required.' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and must not be empty.' });
  }
  if (!name || !address) {
    return res.status(400).json({ error: 'Name and address are required.' });
  }

  try {
    // Find customer by ID or email
    let customer = null;
    if (customerId) {
      customer = Account.findById(customerId);
    } else {
      customer = Account.findByEmail(email);
    }

    // Validate all products in items exist and calculate total
    let total = 0;
    const validatedItems = items.map(item => {
      const product = Product.getById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found.`);
      }
      const qty = Number(item.qty || 1);
      const lineTotal = +(product.price * qty).toFixed(2);
      total += lineTotal;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        qty,
        lineTotal,
      };
    });

    total = +total.toFixed(2);
    const tax = +(total * 0.1).toFixed(2);
    const finalTotal = +(total + tax).toFixed(2);

    // Create order
    const order = {
      id: 'ORD-' + Date.now(),
      userId: customer ? customer.id : null,
      email: email || customer?.email || 'unknown',
      name: name || customer?.name || 'Guest',
      address: address || customer?.address || '',
      items: validatedItems,
      subtotal: total,
      tax,
      total: finalTotal,
      status: 'confirmed',
      createdBy: req.session.user.id,
      createdAt: new Date().toISOString(),
    };

    const saved = Order.add(order);
    res.status(201).json({ success: true, order: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /staff/orders/:orderId/status - update order status
exports.updateOrderStatus = (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const order = Order.updateStatus(req.params.orderId, status);
    res.json({ success: true, order });
  } catch (err) {
    if (err.message === 'Order not found.') {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};

// GET /staff/customers - list all customers (for order creation)
exports.listCustomers = (req, res) => {
  const customers = Account.getAll()
    .filter(a => a.role === 'customer')
    .map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      address: a.address,
    }));

  res.json({
    success: true,
    customers,
    count: customers.length,
  });
};

// GET /staff/customers/:customerId - get customer details
exports.getCustomer = (req, res) => {
  const customer = Account.findById(req.params.customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });

  const orders = Order.getByUserId(customer.id);
  res.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      address: customer.address,
      role: customer.role,
    },
    orders,
  });
};

// GET /staff/stats - get order statistics
exports.getStats = (req, res) => {
  const orders = Order.getAll();
  const customers = Account.getAll().filter(a => a.role === 'customer');

  const stats = {
    totalOrders: orders.length,
    totalRevenue: Order.totalRevenue(),
    totalCustomers: customers.length,
    ordersByStatus: {},
  };

  // Count orders by status
  orders.forEach(o => {
    const status = o.status || 'unknown';
    stats.ordersByStatus[status] = (stats.ordersByStatus[status] || 0) + 1;
  });

  res.json({ success: true, stats });
};
