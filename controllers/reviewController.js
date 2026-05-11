const { Review, Product, Order, OrderItem, User, sequelize } = require('../models');

/**
 * POST /api/reviews
 * Создать или обновить отзыв (о товаре или о магазине).
 * Только для авторизованных пользователей, купивших товар (для product) или имеющих хотя бы один заказ (для shop).
 */
exports.createOrUpdateReview = async (req, res, next) => {
  try {
    const { product_id, rating, text, type = 'product' } = req.body;
    const userId = req.user.id;

    // Валидация
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Текст отзыва обязателен' });
    }
    if (type === 'product' && !product_id) {
      return res.status(400).json({ error: 'Для отзыва о товаре нужно указать product_id' });
    }
    if (type === 'shop' && product_id) {
      return res.status(400).json({ error: 'Для отзыва о магазине product_id должен отсутствовать' });
    }

    // Проверка права на отзыв: пользователь должен был купить товар (для product) или иметь любой завершённый заказ (для shop)
    if (type === 'product') {
      const hasPurchased = await Order.findOne({
        where: { user_id: userId, status: 'delivered' },
        include: [
          {
            model: OrderItem,
            as: 'items',
            where: { product_id },
            required: true,
          },
        ],
      });
      if (!hasPurchased) {
        return res.status(403).json({ error: 'Вы можете оставить отзыв только после получения заказа с этим товаром' });
      }
    } else if (type === 'shop') {
      const hasAnyOrder = await Order.findOne({
        where: { user_id: userId, status: 'delivered' },
      });
      if (!hasAnyOrder) {
        return res.status(403).json({ error: 'Чтобы оставить отзыв о магазине, нужно иметь хотя бы один завершённый заказ' });
      }
    }

    // Ищем существующий отзыв
    const where = {
      user_id: userId,
      product_id: type === 'product' ? product_id : null,
      type,
    };
    let review = await Review.findOne({ where });

    if (review) {
      // Обновить
      review.rating = rating;
      review.text = text;
      await review.save();
    } else {
      // Создать
      review = await Review.create({
        user_id: userId,
        product_id: type === 'product' ? product_id : null,
        rating,
        text,
        type,
      });
    }

    // Пересчёт рейтинга товара, если отзыв о товаре
    if (type === 'product' && product_id) {
      await updateProductRating(product_id);
    }

    // Вернуть отзыв с пользователем
    const result = await Review.findByPk(review.id, {
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
        { model: Product, attributes: ['id', 'name', 'slug'], required: false },
      ],
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/reviews/:id
 * Обновить свой отзыв (альтернативный способ).
 * Тело: { rating, text }
 */
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден или вы не можете его редактировать' });
    }

    const { rating, text } = req.body;
    if (rating) review.rating = rating;
    if (text) review.text = text;
    await review.save();

    if (review.type === 'product' && review.product_id) {
      await updateProductRating(review.product_id);
    }

    const result = await Review.findByPk(review.id, {
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/reviews/:id
 * Удалить свой отзыв.
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден или вы не можете его удалить' });
    }

    const productId = review.product_id;
    const type = review.type;
    await review.destroy();

    if (type === 'product' && productId) {
      await updateProductRating(productId);
    }

    res.json({ message: 'Отзыв удалён' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/product/:productId
 * Получить отзывы о конкретном товаре.
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { product_id: req.params.productId, type: 'product' },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/shop
 * Получить отзывы о магазине.
 */
exports.getShopReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { type: 'shop' },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// Вспомогательная функция пересчёта рейтинга товара
async function updateProductRating(productId) {
  const stats = await Review.findAll({
    where: { product_id: productId, type: 'product' },
    attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
    raw: true,
  });
  const avg = stats[0].avgRating || 0;
  await Product.update(
    { rating: parseFloat(avg).toFixed(2) },
    { where: { id: productId } }
  );
}