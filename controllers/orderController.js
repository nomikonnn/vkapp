const notificationService = require('../services/notificationService');
const orderService = require('../services/orderService');
const { Order, OrderItem, Payment, Delivery, User } = require('../models');

/**
 * Преобразование даты в формат YYYY-MM-DD (если она в формате DD.MM.YYYY)
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  
  // Если уже в формате YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  
  // Если в формате DD.MM.YYYY → конвертируем
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

/**
 * POST /api/orders
 * Создание заказа (только авторизованные пользователи)
 */
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Нормализация даты доставки на случай неверного формата
    const body = { ...req.body };
    if (body.delivery_date) {
      const normalized = normalizeDate(body.delivery_date);
      if (!normalized) {
        return res.status(400).json({ 
          error: 'Неверный формат даты доставки. Используйте формат ГГГГ-ММ-ДД или ДД.ММ.ГГГГ' 
        });
      }
      body.delivery_date = normalized;
    }

    const order = await orderService.createOrder(userId, body);

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
    console.error('Ошибка создания заказа:', err);
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