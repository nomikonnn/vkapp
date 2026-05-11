const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// Все операции с избранным требуют авторизации
router.use(authMiddleware);

// Валидация для добавления
const addToFavoritesValidation = [
  body('product_id').isInt({ min: 1 }).withMessage('Укажите корректный ID товара'),
];

// Валидация для удаления по параметру product_id
const removeFromFavoritesValidation = [
  param('product_id').isInt({ min: 1 }).withMessage('Некорректный ID товара'),
];

router.get('/', favoriteController.getFavorites);
router.post('/', addToFavoritesValidation, favoriteController.addToFavorites);
router.delete('/:product_id', removeFromFavoritesValidation, favoriteController.removeFromFavorites);

module.exports = router;