// backend/controllers/botOrderController.js
const { Order, OrderItem, Product, User } = require('../models');

exports.getBotOrders = async (req, res, next) => {
  try {
    const { vk_id } = req.query;
    if (!vk_id) return res.status(400).json({ error: 'vk_id обязателен' });

    const user = await User.findOne({ where: { vk_id } });
    if (!user) return res.json([]);

    const orders = await Order.findAll({
      where: { user_id: user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, attributes: ['name', 'price'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};