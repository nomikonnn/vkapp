const { Cart, Product } = require('../models');

/**
 * GET /api/cart
 * Получить корзину текущего пользователя.
 */
exports.getCart = async (req, res, next) => {
  try {
    const cartItems = await Cart.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'slug', 'price', 'old_price', 'stock', 'is_active'],
        },
      ],
      order: [['added_at', 'DESC']],
    });

    res.json(cartItems);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cart
 * Добавить товар в корзину.
 * Тело запроса: { product_id: number, quantity?: number (по умолчанию 1) }
 */
exports.addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Проверка, что товар существует и активен
    const product = await Product.findByPk(product_id);
    if (!product || !product.is_active) {
      return res.status(404).json({ error: 'Товар не найден или недоступен' });
    }

    // Проверка достаточного количества на складе
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Недостаточно товара на складе' });
    }

    // Ищем существующую запись в корзине для этого пользователя и товара
    const [cartItem, created] = await Cart.findOrCreate({
      where: { user_id: userId, product_id },
      defaults: { quantity },
    });

    if (!created) {
      // Если запись уже была, увеличиваем количество
      cartItem.quantity += quantity;
      // Дополнительно проверяем, что итоговое количество не превышает остаток
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({ error: 'Недостаточно товара на складе для запрошенного количества' });
      }
      await cartItem.save();
    }

    // Загружаем с товаром для ответа
    const result = await Cart.findByPk(cartItem.id, {
      include: [{ model: Product, attributes: ['id', 'name', 'slug', 'price', 'stock'] }],
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/cart/:id
 * Изменить количество товара в корзине.
 * Тело запроса: { quantity: number }
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cartItem = await Cart.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Элемент корзины не найден' });
    }

    // Если количество <= 0, удаляем элемент
    if (quantity <= 0) {
      await cartItem.destroy();
      return res.json({ message: 'Товар удалён из корзины' });
    }

    // Проверка наличия товара на складе
    const product = await Product.findByPk(cartItem.product_id);
    if (!product || product.stock < quantity) {
      return res.status(400).json({ error: 'Недостаточно товара на складе' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    const result = await Cart.findByPk(cartItem.id, {
      include: [{ model: Product, attributes: ['id', 'name', 'slug', 'price', 'stock'] }],
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cart/:id
 * Удалить конкретный товар из корзины.
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const cartItem = await Cart.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Элемент корзины не найден' });
    }

    await cartItem.destroy();
    res.json({ message: 'Товар удалён из корзины' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cart
 * Очистить всю корзину пользователя.
 */
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'Корзина очищена' });
  } catch (err) {
    next(err);
  }
};