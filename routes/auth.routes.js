const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');

router.post(
  '/vk-login',
  [
    body('vk_id').notEmpty().isNumeric(),
  ],
  authController.vkLogin
);

router.get('/me', authMiddleware, authController.getMe);

module.exports = router;