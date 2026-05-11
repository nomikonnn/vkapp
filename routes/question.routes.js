const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Публичный маршрут – просмотр вопросов товара
router.get(
  '/product/:productId',
  questionController.getProductQuestions
);

// Защищённый маршрут – задать вопрос
router.post(
  '/',
  authMiddleware,
  [
    body('product_id')
      .isInt({ min: 1 })
      .withMessage('Укажите корректный ID товара'),
    body('question_text')
      .isLength({ min: 2 })
      .withMessage('Вопрос слишком короткий'),
  ],
  questionController.askQuestion
);

module.exports = router;