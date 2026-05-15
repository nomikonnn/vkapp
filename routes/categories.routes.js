const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Category } = require('../models'); // ВАЖНО: деструктуризация!
const authenticateToken = require('../middleware/authenticateToken');
const checkAdmin = require('../middleware/checkAdmin');

// Получить все категории (публичный доступ)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Ошибка получения категорий' });
  }
});

// Создать категорию (только админ)
router.post(
  '/',
  authenticateToken,
  checkAdmin,
  [
    body('name').trim().notEmpty().withMessage('Название обязательно'),
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug может содержать только строчные буквы, цифры и дефисы'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let { name, slug } = req.body;

      // Генерация slug если не указан
      if (!slug) {
        slug = name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Проверка уникальности slug
      const existing = await Category.findOne({ where: { slug } });
      if (existing) {
        return res.status(400).json({ message: 'Категория с таким slug уже существует' });
      }

      const category = await Category.create({ name, slug });
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Ошибка создания категории' });
    }
  }
);

// Обновить категорию (только админ)
router.put(
  '/:id',
  authenticateToken,
  checkAdmin,
  [
    body('name').trim().notEmpty().withMessage('Название обязательно'),
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug может содержать только строчные буквы, цифры и дефисы'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      let { name, slug } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({ message: 'Категория не найдена' });
      }

      // Генерация slug если не указан
      if (!slug) {
        slug = name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Проверка уникальности slug (кроме текущей категории)
      const existing = await Category.findOne({ where: { slug } });
      if (existing && existing.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Категория с таким slug уже существует' });
      }

      await category.update({ name, slug });
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Ошибка обновления категории' });
    }
  }
);

// Удалить категорию (только админ)
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Категория не найдена' });
    }

    await category.destroy();
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Ошибка удаления категории' });
  }
});

module.exports = router;