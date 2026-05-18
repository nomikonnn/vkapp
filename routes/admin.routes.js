const express      = require('express');
const router       = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { body, validationResult } = require('express-validator');

router.use(authMiddleware, adminMiddleware);

// ---------- КАТЕГОРИИ ----------
const categoriesRoutes = require('./categories.routes');
router.use('/categories', categoriesRoutes);

// ---------- ТОВАРЫ ----------
router.get('/products', adminController.getAllProducts);

const productValidation = [
  body('name').notEmpty().withMessage('Название обязательно')
    .isLength({ max: 300 }).withMessage('Не более 300 символов'),
  body('price').isFloat({ min: 0 }).withMessage('Цена должна быть положительной'),
  body('category_id').isInt({ min: 1 }).withMessage('Категория обязательна'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Количество — неотрицательное целое'),
];

router.post(
  '/products',
  productValidation,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  adminController.createProduct
);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// ---------- ЗАКАЗЫ ----------
router.get('/orders', adminController.getAllOrders);
router.put(
  '/orders/:id/status',
  [body('status')
    .isIn(['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Неверный статус')],
  adminController.updateOrderStatus
);
router.delete('/orders/:id', adminController.deleteOrder); // добавлено

// ---------- ОТЗЫВЫ ----------
router.get('/reviews', adminController.getAllReviews);
router.put('/reviews/:id', adminController.updateReview);
router.delete('/reviews/:id', adminController.deleteReview);

// ---------- ВОПРОСЫ ----------
router.get('/questions', adminController.getAllQuestions);
router.put(
  '/questions/:id/answer',
  [body('answer_text').notEmpty().withMessage('Текст ответа обязателен')],
  adminController.answerQuestion
);
router.delete('/questions/:id', adminController.deleteQuestion);

module.exports = router;