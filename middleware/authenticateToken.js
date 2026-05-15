// backend/middleware/authenticateToken.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Требуется токен авторизации' });
    }

    const token = authHeader.split(' ')[1];
    
    // Проверка токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    
    // Загрузка пользователя из БД
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    // Добавляем пользователя в req для использования в роутах
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Невалидный токен' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Токен истёк' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Ошибка авторизации' });
  }
};