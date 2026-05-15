module.exports = (req, res, next) => {
  // Проверка что пользователь авторизован
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  // Проверка что пользователь админ
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещён. Требуются права администратора.' });
  }

  next();
};