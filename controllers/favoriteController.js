const { Favorite, Product } = require('../models');

/**
 * GET /api/favorites
 * Получить список избранного текущего пользователя.
 */
exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'slug', 'price', 'old_price', 'rating', 'stock', 'is_active'],
        },
      ],
      order: [['added_at', 'DESC']],
    });

    res.json(favorites);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/favorites
 * Добавить товар в избранное.
 * Тело запроса: { product_id: number }
 */
exports.addToFavorites = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const userId = req.user.id;

    // Проверка, что товар существует
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // findOrCreate — если уже есть, то ничего не делаем
    const [favorite, created] = await Favorite.findOrCreate({
      where: { user_id: userId, product_id },
      defaults: { product_id }, // user_id автоматически подставится из where
    });

    if (!created) {
      return res.status(409).json({ error: 'Товар уже в избранном' });
    }

    // Загружаем с товаром для ответа
    const result = await Favorite.findByPk(favorite.id, {
      include: [{ model: Product, attributes: ['id', 'name', 'slug', 'price'] }],
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/favorites/:product_id
 * Удалить товар из избранного.
 * Параметр — product_id (не id записи, для удобства фронтенда).
 */
exports.removeFromFavorites = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const userId = req.user.id;

    const deletedCount = await Favorite.destroy({
      where: { user_id: userId, product_id },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Товар не найден в избранном' });
    }

    res.json({ message: 'Товар удалён из избранного' });
  } catch (err) {
    next(err);
  }
};