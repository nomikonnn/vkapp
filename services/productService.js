const { Op } = require('sequelize');
const { Product, Category, ProductImage, Review, User } = require('../models');

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

  if (categoryId) {
    where.category_id = parseInt(categoryId);
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

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
        model: Category,          // без алиаса
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
    distinct: true,
  });

  return {
    products,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  };
};

exports.getProductBySlug = async (slug) => {
  const product = await Product.findOne({
    where: { slug, is_active: true },
    include: [
      {
        model: Category,          // без алиаса
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
          {
            model: User,
            attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          },
        ],
        order: [['created_at', 'DESC']],
        required: false,
      },
    ],
  });

  return product;
};