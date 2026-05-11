const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Публичные маршруты
router.get('/', productController.getProducts);          // GET /api/products?page=1&limit=20&category=1&minPrice=1000&maxPrice=50000&search=гитара&sort=newest
router.get('/:slug', productController.getProductBySlug); // GET /api/products/ibanez-rg450

// Админские маршруты
router.post('/', authMiddleware, adminMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;