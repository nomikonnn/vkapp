const { Question, User, Product } = require('../models');

/**
 * POST /api/questions
 * Задать вопрос по товару (только авторизованные пользователи).
 * Тело запроса: { product_id: number, question_text: string }
 */
exports.askQuestion = async (req, res, next) => {
  try {
    const { product_id, question_text } = req.body;
    const userId = req.user.id;

    // Проверка существования товара
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Валидация текста вопроса
    if (!question_text || question_text.trim().length === 0) {
      return res.status(400).json({ error: 'Текст вопроса обязателен' });
    }

    const question = await Question.create({
      user_id: userId,
      product_id,
      question_text: question_text.trim(),
    });

    // Загружаем вопрос с информацией о пользователе
    const result = await Question.findByPk(question.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
        },
      ],
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/questions/product/:productId
 * Получить все вопросы по конкретному товару (публичный доступ).
 */
exports.getProductQuestions = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const questions = await Question.findAll({
      where: { product_id: productId },
      include: [
        {
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
        },
        {
          model: User,
          as: 'answeredByUser',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(questions);
  } catch (err) {
    next(err);
  }
};