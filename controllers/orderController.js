const notificationService = require('../services/notificationService');
const orderService = require('../services/orderService');
const { Order, OrderItem, Payment, Delivery, User } = require('../models');

/**
 * POST /api/orders
 * Создание заказа (только авторизованные пользователи)
 */
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const order = await orderService.createOrder(userId, req.body);

    // Отправляем уведомление пользователю (если он привязан к VK)
    const user = await User.findByPk(userId);
    if (user) {
      await notificationService.notifyNewOrder(user, order.id);
    }

    res.status(201).json({
      message: 'Заказ успешно создан',
      order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders
 * Получить список заказов текущего пользователя
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery' },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:id
 * Детальная информация о заказе (своего)
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery' },
      ],
    });
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/orders/:id/cancel
 * Отмена заказа (только в статусе 'pending')
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id, status: 'pending' },
    });
    if (!order) {
      return res.status(400).json({ error: 'Заказ нельзя отменить (не в статусе ожидания или не существует)' });
    }

    order.status = 'cancelled';
    await order.save();

    // Отправляем уведомление об отмене
    const user = await User.findByPk(req.user.id);
    if (user) {
      await notificationService.notifyOrderCancelled(user, order.id);
    }

    res.json({ message: 'Заказ отменён', order });
  } catch (err) {
    next(err);
  }
};