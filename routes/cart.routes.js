const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// Все операции с корзиной требуют авторизации
router.use(authMiddleware);

// Валидация для добавления в корзину
const addToCartValidation = [
  body('product_id').isInt({ min: 1 }).withMessage('Укажите корректный ID товара'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Количество должно быть положительным числом'),
];

// Валидация для изменения количества
const updateCartValidation = [
  param('id').isInt({ min: 1 }).withMessage('Некорректный ID элемента корзины'),
  body('quantity').isInt().withMessage('Количество обязательно'),
];

router.get('/', cartController.getCart);
router.post('/', addToCartValidation, cartController.addToCart);
router.put('/:id', updateCartValidation, cartController.updateCartItem);
router.delete('/:id', cartController.removeFromCart);
router.delete('/', cartController.clearCart); // Очистка всей корзины

module.exports = router;