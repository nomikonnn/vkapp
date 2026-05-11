const productService = require('../services/productService');
const { Product } = require('../models'); // импорт модели Product

/**
 * GET /api/products
 * Список товаров с фильтрацией, поиском, сортировкой, пагинацией.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:slug
 * Детальная информация о товаре.
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

/**
 * POST /api/products
 * Создание товара (администратор).
 */
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Обновление товара (администратор).
 */
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

/**
 * DELETE /api/products/:id
 * Удаление товара (администратор).
 */
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