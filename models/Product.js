'use strict';

const fs     = require('fs');
const path   = require('path');
const types  = require('../data/types.json');
const Category = require('./Category');

const dataFile = path.join(__dirname, '..', 'data', 'products.json');

function readProducts() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const products = raw ? JSON.parse(raw) : [];
    return Array.isArray(products) ? products : [];
  } catch (_) {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
}

class Product {
  static getAll() {
    return readProducts();
  }

  static getById(id) {
    return Product.getAll().find(p => p.id === Number(id));
  }

  static getCategories() {
    return Category.getAll();
  }

  static getTypes() {
    return types;
  }

  static add({ name, price, category, type, badge, desc, image }) {
    if (!name || price === undefined || !category) {
      throw new Error('Name, price, and category are required.');
    }

    const products = Product.getAll();
    const newProduct = {
      id:       Math.max(...products.map(p => p.id || 0), 0) + 1,
      name:     String(name).trim(),
      price:    Number(price),
      image:    image || '/images/default.svg',
      category: String(category).trim(),
      type:     type ? String(type).trim() : null,
      badge:    badge ? String(badge).trim() : null,
      desc:     desc ? String(desc).trim() : '',
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    writeProducts(products);
    return newProduct;
  }

  static update(id, fields) {
    const products = Product.getAll();
    const idx = products.findIndex(p => p.id === Number(id));
    if (idx === -1) throw new Error('Product not found.');
    
    const allowed = ['name', 'price', 'image', 'category', 'type', 'badge', 'desc'];
    const updates = {};
    allowed.forEach(key => {
      if (fields[key] !== undefined) updates[key] = fields[key];
    });

    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
    writeProducts(products);
    return products[idx];
  }

  static delete(id) {
    const products = Product.getAll();
    const idx = products.findIndex(p => p.id === Number(id));
    if (idx === -1) throw new Error('Product not found.');
    const deleted = products.splice(idx, 1);
    writeProducts(products);
    return deleted[0];
  }
}

module.exports = Product;
