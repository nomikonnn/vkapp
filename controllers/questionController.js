const { Question, User, Product } = require('../models');

exports.askQuestion = async (req, res, next) => {
  try {
    // Принимаем text / question / question_text — фронтенд шлёт все три
    const rawText = req.body.question_text || req.body.text || req.body.question;
    const { product_id } = req.body;
    const userId = req.user.id;

    const product = await Product.findByPk(product_id);
    if (!product)
      return res.status(404).json({ error: 'Товар не найден' });

    if (!rawText || rawText.trim().length === 0)
      return res.status(400).json({ error: 'Текст вопроса обязателен' });

    const question = await Question.create({
      user_id:       userId,
      product_id,
      question_text: rawText.trim(),
    });

    const result = await Question.findByPk(question.id, {
      include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }],
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getProductQuestions = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const questions = await Question.findAll({
      where: { product_id: productId },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(questions);
  } catch (err) {
    next(err);
  }
};

exports.answerQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answer_text } = req.body;

    if (!answer_text || answer_text.trim().length === 0)
      return res.status(400).json({ error: 'Текст ответа обязателен' });

    const question = await Question.findByPk(id);
    if (!question)
      return res.status(404).json({ error: 'Вопрос не найден' });

    question.answer_text  = answer_text.trim();
    question.answered_by  = req.user.id;
    question.answered_at  = new Date();
    await question.save();

    const result = await Question.findByPk(question.id, {
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
      ],
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};