const { Cart, Product, Order, OrderItem, Payment, Delivery, sequelize } = require('../models');

/**
 * Проверяет корзину пользователя, рассчитывает суммы и создаёт заказ.
 * @param {number} userId - ID пользователя
 * @param {Object} orderData - данные заказа (delivery_type, address, date, time, payment_method, promo_code, note)
 * @returns {Object} созданный заказ
 */
exports.createOrder = async (userId, orderData) => {
  const {
    delivery_type,
    delivery_address,
    delivery_date,
    delivery_time_window,
    payment_method,
    promo_code,
    note,
  } = orderData;

  // 1. Получаем корзину
  const cartItems = await Cart.findAll({
    where: { user_id: userId },
    include: [{ model: Product, required: true }],
  });

  if (!cartItems.length) {
    throw new Error('Корзина пуста');
  }

  // 2. Проверяем наличие товара и считаем сумму
  let originalAmount = 0;
  const orderItemsData = [];

  for (const item of cartItems) {
    if (item.Product.stock < item.quantity) {
      throw new Error(`Недостаточно товара «${item.Product.name}» на складе`);
    }
    if (!item.Product.is_active) {
      throw new Error(`Товар «${item.Product.name}» недоступен`);
    }
    originalAmount += parseFloat(item.Product.price) * item.quantity;
    orderItemsData.push({
      product_id: item.product_id,
      product_name: item.Product.name,
      price: item.Product.price,
      quantity: item.quantity,
    });
  }

  // 3. Рассчитываем скидку по промокоду
  let discountAmount = 0;
  if (promo_code) {
    discountAmount = exports.calculateDiscount(promo_code, originalAmount);
  }

  // 4. Стоимость доставки
  const deliveryCost = delivery_type === 'courier' ? 300 : 150;

  // 5. Итоговая сумма
  const totalAmount = originalAmount - discountAmount + deliveryCost;

  // 6. Транзакция создания заказа
  const t = await sequelize.transaction();
  try {
    // Создаём заказ
    const order = await Order.create({
      user_id: userId,
      delivery_type,
      delivery_address,
      delivery_date,
      delivery_time_window,
      payment_method,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      delivery_cost: deliveryCost,
      total_amount: totalAmount,
      promo_code,
      note,
    }, { transaction: t });

    // Позиции заказа
    await OrderItem.bulkCreate(
      orderItemsData.map(item => ({ ...item, order_id: order.id })),
      { transaction: t }
    );

    // Платёж
    await Payment.create({
      order_id: order.id,
      method: payment_method,
      status: 'pending',
      amount: totalAmount,
    }, { transaction: t });

    // Доставка
    await Delivery.create({
      order_id: order.id,
      type: delivery_type,
      address: delivery_address,
      delivery_date,
      time_window: delivery_time_window,
    }, { transaction: t });

    // Списываем товары и очищаем корзину
    for (const item of cartItems) {
      item.Product.stock -= item.quantity;
      await item.Product.save({ transaction: t });
    }
    await Cart.destroy({ where: { user_id: userId }, transaction: t });

    await t.commit();

    // Возвращаем заказ с вложениями
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' },
        { model: Delivery, as: 'delivery' },
      ],
    });

    return fullOrder;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Расчёт скидки по промокоду.
 * Здесь можно подключить реальную проверку кода из БД, пока заглушка.
 */
exports.calculateDiscount = (code, amount) => {
  // Пример фиксированных промокодов
  const promoCodes = {
    'SALE10': 10,   // 10%
    'MUSIC20': 20,  // 20%
  };
  const discountPercent = promoCodes[code.toUpperCase()];
  if (!discountPercent) {
    throw new Error('Недействительный промокод');
  }
  return (amount * discountPercent) / 100;
};