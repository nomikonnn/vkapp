const { Op } = require('sequelize');
const { Product, Category, ProductImage, Review } = require('../models');

/**
 * Получение списка товаров с фильтрацией, поиском, сортировкой, пагинацией.
 * @param {Object} query - параметры запроса
 * @returns {Object} { products, total, page, pages }
 */
exports.getProducts = async (query) => {
  const {
    page = 1,
    limit = 20,
    category: categoryId,
    minPrice,
    maxPrice,
    search,
    sort,
  } = query;

  const where = { is_active: true };

  // Фильтр по категории
  if (categoryId) {
    where.category_id = parseInt(categoryId);
  }

  // Фильтр по цене
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
  }

  // Поиск по названию и описанию
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  // Сортировка
  let order;
  switch (sort) {
    case 'price_asc':
      order = [['price', 'ASC']];
      break;
    case 'price_desc':
      order = [['price', 'DESC']];
      break;
    case 'newest':
      order = [['created_at', 'DESC']];
      break;
    case 'rating':
      order = [['rating', 'DESC']];
      break;
    default:
      order = [['id', 'ASC']];
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows: products, count: total } = await Product.findAndCountAll({
    where,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'image_url', 'is_main'],
        required: false,
        where: { is_main: true },
        limit: 1,
      },
    ],
    order,
    limit: parseInt(limit),
    offset,
    distinct: true, // важно при использовании include
  });

  return {
    products,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  };
};

/**
 * Получение товара по slug с категорией, изображениями и отзывами.
 * @param {string} slug
 * @returns {Object|null} product
 */
exports.getProductBySlug = async (slug) => {
  const product = await Product.findOne({
    where: { slug, is_active: true },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'image_url', 'is_main', 'sort_order'],
      },
      {
        model: Review,
        as: 'reviews',
        include: [
          { model: require('../models').User, attributes: ['id', 'first_name', 'last_name', 'avatar_url'] },
        ],
        order: [['created_at', 'DESC']],
        required: false,
      },
    ],
  });

  return product;
};