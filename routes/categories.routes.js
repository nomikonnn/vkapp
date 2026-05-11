const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Публичный маршрут – получить все категории (для выпадающего списка)
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Админские маршруты для управления категориями
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Категория не найдена' });
    await category.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;