'use strict';

const fs        = require('fs');
const path      = require('path');
const Product   = require('../models/Product');
const productCtrl = require('../controllers/productController');

const dataFile = path.join(__dirname, '..', 'data', 'products.json');
const backup   = path.join(__dirname, '..', 'data', 'products.json.bak');

function mockReq(body = {}, params = {}) {
  return { body, params };
}

function mockRes() {
  const res = {};
  res.json = jest.fn((data) => res);
  res.status = jest.fn(() => res);
  return res;
}

beforeAll(() => {
  if (fs.existsSync(dataFile)) fs.copyFileSync(dataFile, backup);
});

afterAll(() => {
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, dataFile);
    fs.unlinkSync(backup);
  }
});

beforeEach(() => {
  fs.writeFileSync(dataFile, JSON.stringify([
    { id: 1, name: 'Product 1', price: 10, category: 'Test', type: 'Type1', badge: null, desc: 'Test product 1' },
    { id: 2, name: 'Product 2', price: 20, category: 'Test', type: 'Type2', badge: 'New', desc: 'Test product 2' },
  ], null, 2));
});

afterEach(() => {
  fs.writeFileSync(dataFile, '[]');
});

describe('ProductController', () => {
  describe('listProducts', () => {
    test('returns all products', () => {
      const req = mockReq();
      const res = mockRes();
      productCtrl.listProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
        })
      );
    });
  });

  describe('getProduct', () => {
    test('returns product by id', () => {
      const req = mockReq({}, { id: '1' });
      const res = mockRes();
      productCtrl.getProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          product: expect.objectContaining({ id: 1, name: 'Product 1' }),
        })
      );
    });

    test('returns 404 for non-existent product', () => {
      const req = mockReq({}, { id: '999' });
      const res = mockRes();
      productCtrl.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Product not found.' })
      );
    });
  });

  describe('createProduct', () => {
    test('creates new product successfully', () => {
      const req = mockReq({
        name: 'New Product',
        price: 25.99,
        category: 'Electronics',
        type: 'Gadget',
        desc: 'A new gadget',
      });
      const res = mockRes();
      productCtrl.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          product: expect.objectContaining({
            name: 'New Product',
            price: 25.99,
            category: 'Electronics',
          }),
        })
      );

      // Verify product is saved
      const allProducts = Product.getAll();
      expect(allProducts.length).toBe(3);
    });

    test('returns 400 if name is missing', () => {
      const req = mockReq({
        price: 25,
        category: 'Electronics',
      });
      const res = mockRes();
      productCtrl.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('required') })
      );
    });

    test('returns 400 if price is missing', () => {
      const req = mockReq({
        name: 'Product',
        category: 'Electronics',
      });
      const res = mockRes();
      productCtrl.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 if category is missing', () => {
      const req = mockReq({
        name: 'Product',
        price: 25,
      });
      const res = mockRes();
      productCtrl.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProduct', () => {
    test('updates product successfully', () => {
      const req = mockReq(
        { name: 'Updated Product', price: 15 },
        { id: '1' }
      );
      const res = mockRes();
      productCtrl.updateProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          product: expect.objectContaining({
            id: 1,
            name: 'Updated Product',
            price: 15,
          }),
        })
      );

      // Verify update is saved
      const product = Product.getById(1);
      expect(product.name).toBe('Updated Product');
      expect(product.price).toBe(15);
    });

    test('returns 404 for non-existent product', () => {
      const req = mockReq({ name: 'New Name' }, { id: '999' });
      const res = mockRes();
      productCtrl.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('allows partial updates', () => {
      const req = mockReq({ price: 30 }, { id: '1' });
      const res = mockRes();
      productCtrl.updateProduct(req, res);

      const product = Product.getById(1);
      expect(product.name).toBe('Product 1'); // unchanged
      expect(product.price).toBe(30); // changed
    });
  });

  describe('deleteProduct', () => {
    test('deletes product successfully', () => {
      const req = mockReq({}, { id: '1' });
      const res = mockRes();
      productCtrl.deleteProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Product deleted.',
        })
      );

      // Verify deletion
      const product = Product.getById(1);
      expect(product).toBeUndefined();
      expect(Product.getAll().length).toBe(1);
    });

    test('returns 404 for non-existent product', () => {
      const req = mockReq({}, { id: '999' });
      const res = mockRes();
      productCtrl.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getCategories', () => {
    test('returns all categories', () => {
      const req = mockReq();
      const res = mockRes();
      productCtrl.getCategories(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          categories: expect.any(Array),
        })
      );
    });
  });

  describe('getTypes', () => {
    test('returns all types', () => {
      const req = mockReq();
      const res = mockRes();
      productCtrl.getTypes(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          types: expect.any(Array),
        })
      );
    });
  });
});
