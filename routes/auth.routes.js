const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// VK-логин (упрощённая валидация)
router.post(
  '/vk-login',
  [
    body('vk_id').notEmpty().isNumeric(), // убрали проверку sign
  ],
  authController.vkLogin
);

// Новый маршрут – вход по email/паролю
router.post('/login', authController.loginWithPassword);

router.get('/me', authMiddleware, authController.getMe);

router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;