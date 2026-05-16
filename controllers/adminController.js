// backend/controllers/adminController.js
const notificationService = require('../services/notificationService');
const {
  Product,
  ProductImage,
  Order,
  OrderItem,
  Payment,
  Delivery,
  Review,
  Question,
  User,
  Category,
  sequelize,
} = require('../models');

// ---------- УТИЛИТА ДЛЯ SLUG ----------
const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-') +
  '-' +
  Date.now();

// ---------- УПРАВЛЕНИЕ ТОВАРАМИ ----------
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category, as: 'category' }],
      order: [['created_at', 'DESC']],
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { images, ...productData } = req.body;

    if (!productData.slug) {
      productData.slug = slugify(productData.name || 'product');
    }

    const validImages = (images || []).filter(
      (url) => typeof url === 'string' && /^https?:\/\/.+/.test(url.trim())
    );

    const product = await Product.create(productData);

    if (validImages.length) {
      const imageRecords = validImages.map((url) => ({
        product_id: product.id,
        image_url: url.trim(),
        is_main: false,
        sort_order: 0,
      }));
      await ProductImage.bulkCreate(imageRecords);
    }

    const result = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' },
      ],
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    const { images, ...productData } = req.body;

    if (productData.name && !productData.slug) {
      productData.slug = slugify(productData.name);
    }

    await product.update(productData);

    if (images !== undefined) {
      await ProductImage.destroy({ where: { product_id: product.id } });

      const validImages = (images || []).filter(
        (url) => typeof url === 'string' && /^https?:\/\/.+/.test(url.trim())
      );

      if (validImages.length) {
        const imageRecords = validImages.map((url) => ({
          product_id: product.id,
          image_url: url.trim(),
          is_main: false,
          sort_order: 0,
        }));
        await ProductImage.bulkCreate(imageRecords);
      }
    }

    const result = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductImage, as: 'images' },
      ],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    await product.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// ---------- УПРАВЛЕНИЕ ЗАКАЗАМИ ----------
exports.getAllOrders = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    // Загружаем заказы без User
    const orders = await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'items', required: false },
        { model: Payment, as: 'payment', required: false },
        { model: Delivery, as: 'delivery', required: false },
      ],
      order: [['created_at', 'DESC']],
    });

    // Загружаем пользователей отдельно
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    const users = userIds.length > 0 
      ? await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'vk_id', 'first_name', 'last_name', 'email', 'phone'],
        })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u.toJSON()]));

    // Объединяем
    const result = orders.map(o => ({
      ...o.toJSON(),
      user: userMap[o.user_id] || null,
    }));

    res.json(result);
  } catch (err) {
    console.error('getAllOrders error:', err);
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Payment, as: 'payment', required: false },
        { model: Delivery, as: 'delivery', required: false },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    const allowedStatuses = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    if (status === 'paid' && order.payment) {
      order.payment.status = 'completed';
      order.payment.paid_at = new Date();
      await order.payment.save();
    }
    if (status === 'shipped' && order.delivery) {
      order.delivery.status = 'in_transit';
      await order.delivery.save();
    }
    if (status === 'delivered' && order.delivery) {
      order.delivery.status = 'delivered';
      await order.delivery.save();
    }

    order.status = status;
    await order.save();

    // Уведомление пользователю
    try {
      const user = await User.findByPk(order.user_id);
      if (user) {
        switch (status) {
          case 'confirmed': await notificationService.notifyOrderConfirmed(user, order.id); break;
          case 'paid': await notificationService.notifyOrderPaid(user, order.id); break;
          case 'shipped': await notificationService.notifyOrderShipped(user, order.id); break;
          case 'delivered': await notificationService.notifyOrderDelivered(user, order.id); break;
          case 'cancelled': await notificationService.notifyOrderCancelled(user, order.id); break;
        }
      }
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json(order);
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    next(err);
  }
};

// ---------- УПРАВЛЕНИЕ ОТЗЫВАМИ ----------
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Product, attributes: ['id', 'name', 'slug'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const { rating, text } = req.body;
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Отзыв не найден' });

    review.rating = rating;
    review.text = text;
    await review.save();

    if (review.type === 'product' && review.product_id) {
      const stats = await Review.findAll({
        where: { product_id: review.product_id, type: 'product' },
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
        raw: true,
      });
      const avg = stats[0].avgRating || 0;
      await Product.update({ rating: avg }, { where: { id: review.product_id } });
    }

    res.json(review);
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Отзыв не найден' });
    await review.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// ---------- УПРАВЛЕНИЕ ВОПРОСАМИ ----------
exports.getAllQuestions = async (req, res, next) => {
  try {
    const questions = await Question.findAll({
      include: [
        { model: Product, attributes: ['id', 'name', 'slug'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });

    // Загружаем пользователей отдельно
    const userIds = [...new Set([
      ...questions.map(q => q.user_id),
      ...questions.map(q => q.answered_by),
    ].filter(Boolean))];
    
    const users = userIds.length > 0
      ? await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'first_name', 'last_name'],
        })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u.toJSON()]));

    const result = questions.map(q => ({
      ...q.toJSON(),
      user: userMap[q.user_id] || null,
      answered_by_user: userMap[q.answered_by] || null,
    }));

    res.json(result);
  } catch (err) {
    console.error('getAllQuestions error:', err);
    next(err);
  }
};

exports.answerQuestion = async (req, res, next) => {
  try {
    const { answer_text } = req.body;
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Вопрос не найден' });

    question.answer_text = answer_text;
    question.answered_by = req.user.id;
    question.answered_at = new Date();
    await question.save();

    res.json(question);
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Вопрос не найден' });
    await question.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};