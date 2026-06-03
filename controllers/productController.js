'use strict';

const Product = require('../models/Product');
const Category = require('../models/Category');

// GET /staff/products - show all products (staff management page)
exports.listProducts = (req, res) => {
  const products = Product.getAll();
  res.json({
    success: true,
    products,
    count: products.length,
  });
};

// GET /staff/products/:id - get product details
exports.getProduct = (req, res) => {
  const product = Product.getById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ success: true, product });
};

// POST /staff/products - create new product
exports.createProduct = (req, res) => {
  const { name, price, category, type, badge, desc, image } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required.' });
  }

  try {
    const product = Product.add({ name, price, category, type, badge, desc, image });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /staff/products/:id - update product
exports.updateProduct = (req, res) => {
  const { name, price, category, type, badge, desc, image } = req.body;
  const product = Product.getById(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found.' });

  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (category !== undefined) updates.category = category;
    if (type !== undefined) updates.type = type;
    if (badge !== undefined) updates.badge = badge;
    if (desc !== undefined) updates.desc = desc;
    if (image !== undefined) updates.image = image;

    const updated = Product.update(req.params.id, updates);
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /staff/products/:id - delete product
exports.deleteProduct = (req, res) => {
  const product = Product.getById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  try {
    Product.delete(req.params.id);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /staff/products/categories - get all categories
exports.getCategories = (req, res) => {
  const categories = Category.getAll();
  res.json({ success: true, categories });
};

// GET /staff/products/types - get all types
exports.getTypes = (req, res) => {
  const types = Product.getTypes();
  res.json({ success: true, types });
};
