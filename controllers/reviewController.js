const { Review, Product, Order, OrderItem, User, sequelize } = require('../models');

exports.createOrUpdateReview = async (req, res, next) => {
  try {
    const { product_id, rating, text } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Текст отзыва обязателен' });
    }
    if (!product_id) {
      return res.status(400).json({ error: 'Укажите product_id' });
    }

    let review = await Review.findOne({
      where: { user_id: userId, product_id },
    });

    if (review) {
      review.rating = rating;
      review.text = text;
      await review.save();
    } else {
      const data = { user_id: userId, product_id, rating, text };
      if (Review.rawAttributes.type) {
        data.type = 'product';
      }
      review = await Review.create(data);
    }

    await updateProductRating(product_id);

    const result = await Review.findByPk(review.id, {
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
      ],
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('createOrUpdateReview error:', err);
    next(err);
  }
};

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

    if (review.product_id) {
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

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден или вы не можете его удалить' });
    }

    const productId = review.product_id;
    await review.destroy();

    if (productId) {
      await updateProductRating(productId);
    }

    res.json({ message: 'Отзыв удалён' });
  } catch (err) {
    next(err);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const where = { product_id: req.params.productId };
    
    if (Review.rawAttributes.type) {
      where.type = 'product';
    }
    
    const reviews = await Review.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    console.error('getProductReviews error:', err);
    next(err);
  }
};

exports.getShopReviews = async (req, res, next) => {
  try {
    if (!Review.rawAttributes.type) {
      return res.json([]);
    }
    
    const reviews = await Review.findAll({
      where: { type: 'shop' },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    console.error('getShopReviews error:', err);
    next(err);
  }
};

// Вспомогательная функция пересчёта рейтинга товара
async function updateProductRating(productId) {
  try {
    const where = { product_id: productId };
    
    if (Review.rawAttributes.type) {
      where.type = 'product';
    }
    
    const stats = await Review.findAll({
      where,
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
      raw: true,
    });
    const avg = stats[0]?.avgRating || 0;
    
    if (Product.rawAttributes.rating) {
      await Product.update(
        { rating: parseFloat(avg).toFixed(2) },
        { where: { id: productId } }
      );
    }
  } catch (err) {
    console.error('updateProductRating error:', err);
  }
}