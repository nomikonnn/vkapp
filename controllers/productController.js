// backend/controllers/productController.js
const { Op } = require('sequelize');
const productService = require('../services/productService');
const { Product, ProductImage, Category } = require('../models');

/**
 * GET /api/products
 * Список товаров с картинками
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    const where = {};
    
    // Фильтр по активности (если поле существует)
    if (Product.rawAttributes.is_active) {
      where.is_active = true;
    }
    
    if (category) where.category_id = category;
    if (search) where.name = { [Op.like]: `%${search}%` };
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductImage, as: 'images', required: false },
        { model: Category, as: 'category', required: false },
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });
    
    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    console.error('getProducts error:', err);
    next(err);
  }
};

/**
 * GET /api/products/:slug
 */
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    await product.update(req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    await product.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};