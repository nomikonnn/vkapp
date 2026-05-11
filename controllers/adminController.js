const notificationService = require('../services/notificationService');
const {
  Product,
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

// ---------- УПРАВЛЕНИЕ ТОВАРАМИ ----------
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [{ model: Category }],   // без as: 'category'
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
    const product = await Product.create(productData);

    if (images && Array.isArray(images)) {
      const imageRecords = images.map(url => ({
        product_id: product.id,
        image_url: url,
        is_main: false,        // можно доработать выбор главного изображения
        sort_order: 0
      }));
      await ProductImage.bulkCreate(imageRecords);
    }

    // Возвращаем товар с категорией и изображениями
    const result = await Product.findByPk(product.id, {
      include: [
        { model: Category },
        { model: ProductImage, as: 'images' }
      ]
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
    await product.update(productData);

    // Обновляем изображения: удаляем старые и создаём новые
    if (images !== undefined) {
      await ProductImage.destroy({ where: { product_id: product.id } });
      if (Array.isArray(images)) {
        const imageRecords = images.map(url => ({
          product_id: product.id,
          image_url: url,
          is_main: false,
          sort_order: 0
        }));
        await ProductImage.bulkCreate(imageRecords);
      }
    }

    const result = await Product.findByPk(product.id, {
      include: [
        { model: Category },
        { model: ProductImage, as: 'images' }
      ]
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
    if (req.query.status) {
      where.status = req.query.status;
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery' },
        {
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery' },
        { model: User },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    const allowedStatuses = [
      'pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled',
    ];
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

    if (order.User) {
      switch (status) {
        case 'confirmed':
          await notificationService.notifyOrderConfirmed(order.User, order.id);
          break;
        case 'paid':
          await notificationService.notifyOrderPaid(order.User, order.id);
          break;
        case 'shipped':
          await notificationService.notifyOrderShipped(order.User, order.id);
          break;
        case 'delivered':
          await notificationService.notifyOrderDelivered(order.User, order.id);
          break;
        case 'cancelled':
          await notificationService.notifyOrderCancelled(order.User, order.id);
          break;
        default:
          break;
      }
    }

    res.json(order);
  } catch (err) {
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
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        ],
        raw: true,
      });
      const avg = stats[0].avgRating || 0;
      await Product.update(
        { rating: avg },
        { where: { id: review.product_id } }
      );
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
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: Product, attributes: ['id', 'name', 'slug'] },
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