'use strict';
const express      = require('express');
const router       = express.Router();
const shopCtrl     = require('../controllers/shopController');
const authCtrl     = require('../controllers/authController');
const productCtrl  = require('../controllers/productController');
const orderCtrl    = require('../controllers/orderController');

// ── Shop ──────────────────────────────────────────────────────
router.get('/',             shopCtrl.showShop);
router.post('/cart/add',    shopCtrl.addToCart);
router.get('/cart',         shopCtrl.showCart);
router.post('/cart/update', shopCtrl.updateCart);
router.post('/cart/remove', shopCtrl.removeFromCart);
router.post('/cart/clear',  shopCtrl.clearCart);

// ── Checkout & Orders (login required) ───────────────────────
router.get ('/checkout', authCtrl.requireLogin, shopCtrl.showCheckout);
router.post('/checkout', authCtrl.requireLogin, shopCtrl.placeOrder);
router.get ('/orders',   authCtrl.requireLogin, shopCtrl.showOrderHistory);

// ── Auth ──────────────────────────────────────────────────────
router.get ('/login',    authCtrl.showLogin);
router.post('/login',    authCtrl.login);
router.get ('/logout',   authCtrl.logout);
router.get ('/register', authCtrl.showRegister);
router.post('/register', authCtrl.register);
router.get ('/profile',  authCtrl.requireLogin, authCtrl.showProfile);

// ── Staff: Products Management (staff only) ───────────────────
router.get('/staff/products',       authCtrl.requireStaff, productCtrl.listProducts);
router.get('/staff/products/:id',   authCtrl.requireStaff, productCtrl.getProduct);
router.post('/staff/products',      authCtrl.requireStaff, productCtrl.createProduct);
router.put('/staff/products/:id',   authCtrl.requireStaff, productCtrl.updateProduct);
router.delete('/staff/products/:id', authCtrl.requireStaff, productCtrl.deleteProduct);

// ── Staff: Orders Management (staff only) ──────────────────────
router.get('/staff/orders',         authCtrl.requireStaff, orderCtrl.listOrders);
router.get('/staff/orders/:orderId', authCtrl.requireStaff, orderCtrl.getOrder);
router.post('/staff/orders',        authCtrl.requireStaff, orderCtrl.createOrder);
router.put('/staff/orders/:orderId/status', authCtrl.requireStaff, orderCtrl.updateOrderStatus);
router.get('/staff/customers',      authCtrl.requireStaff, orderCtrl.listCustomers);
router.get('/staff/customers/:customerId', authCtrl.requireStaff, orderCtrl.getCustomer);
router.get('/staff/stats',          authCtrl.requireStaff, orderCtrl.getStats);

module.exports = router;
