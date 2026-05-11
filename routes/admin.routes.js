const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { body, param } = require('express-validator');

// ⚡ Все маршруты требуют авторизацию и роль admin
router.use(authMiddleware, adminMiddleware);

// ---------- Товары ----------
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// ---------- Заказы ----------
router.get('/orders', adminController.getAllOrders);
router.put(
  '/orders/:id/status',
  [
    body('status')
      .isIn(['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Неверный статус'),
  ],
  adminController.updateOrderStatus
);

const categoriesRoutes = require('./categories.routes');
router.use('/categories', authMiddleware, adminMiddleware, categoriesRoutes);

// Товары (CRUD)
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Заказы
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', [
  body('status').isIn(['pending','confirmed','paid','shipped','delivered','cancelled']).withMessage('Неверный статус')
], adminController.updateOrderStatus);

// Отзывы
router.get('/reviews', adminController.getAllReviews);
router.put('/reviews/:id', adminController.updateReview);
router.delete('/reviews/:id', adminController.deleteReview);

// Вопросы
router.get('/questions', adminController.getAllQuestions);
router.put('/questions/:id/answer', [ body('answer_text').notEmpty().withMessage('Текст ответа обязателен') ], adminController.answerQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

module.exports = router;