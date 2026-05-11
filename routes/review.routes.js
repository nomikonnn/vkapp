const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// Публичные маршруты
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/shop', reviewController.getShopReviews);

// Защищённые маршруты
router.post(
  '/',
  authMiddleware,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Оценка от 1 до 5'),
    body('text').isLength({ min: 2 }).withMessage('Текст отзыва слишком короткий'),
    body('type').optional().isIn(['product', 'shop']),
    body('product_id')
      .if(body('type').equals('product'))
      .isInt({ min: 1 })
      .withMessage('Укажите корректный ID товара'),
  ],
  reviewController.createOrUpdateReview
);

router.put(
  '/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('Некорректный ID отзыва'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('text').optional().isLength({ min: 2 }),
  ],
  reviewController.updateReview
);

router.delete(
  '/:id',
  authMiddleware,
  [param('id').isInt({ min: 1 }).withMessage('Некорректный ID отзыва')],
  reviewController.deleteReview
);

module.exports = router;