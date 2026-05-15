require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

// Конфигурация БД
const dbConfig = {
  database: isProduction
    ? process.env.MYSQLDATABASE
    : process.env.DB_NAME,

  username: isProduction
    ? process.env.MYSQLUSER
    : process.env.DB_USER,

  password: isProduction
    ? process.env.MYSQLPASSWORD
    : process.env.DB_PASSWORD,

  host: isProduction
    ? process.env.MYSQLHOST
    : process.env.DB_HOST,

  port: isProduction
    ? process.env.MYSQLPORT
    : process.env.DB_PORT || 3306,
};

// Проверка обязательных ENV
const requiredEnvVars = isProduction
  ? ['MYSQLDATABASE', 'MYSQLUSER', 'MYSQLPASSWORD', 'MYSQLHOST']
  : ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingVars.length > 0) {
  console.error(
    '❌ Отсутствуют обязательные переменные окружения:',
    missingVars.join(', ')
  );

  process.exit(1);
}

// Подключение Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,

    dialect: 'mysql',

    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},

    logging:
      process.env.NODE_ENV === 'development'
        ? console.log
        : false,

    define: {
      timestamps: true,
      underscored: true,
    },

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Проверка подключения к БД
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Подключение к базе данных установлено');
  })
  .catch((err) => {
    console.error(
      '❌ Ошибка подключения к базе данных:',
      err.message
    );
  });

// Импорт моделей
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Category = require('./Category')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const ProductImage = require('./ProductImage')(
  sequelize,
  Sequelize.DataTypes
);
const Cart = require('./Cart')(sequelize, Sequelize.DataTypes);
const Favorite = require('./Favorite')(
  sequelize,
  Sequelize.DataTypes
);
const Order = require('./Order')(sequelize, Sequelize.DataTypes);
const OrderItem = require('./OrderItem')(
  sequelize,
  Sequelize.DataTypes
);
const Payment = require('./Payment')(
  sequelize,
  Sequelize.DataTypes
);
const Delivery = require('./Delivery')(
  sequelize,
  Sequelize.DataTypes
);
const Review = require('./Review')(sequelize, Sequelize.DataTypes);
const Question = require('./Question')(
  sequelize,
  Sequelize.DataTypes
);
const Faq = require('./Faq')(sequelize, Sequelize.DataTypes);
const AboutPage = require('./AboutPage')(
  sequelize,
  Sequelize.DataTypes
);

// =========================
// СВЯЗИ МОДЕЛЕЙ
// =========================

// Категории и товары
Category.hasMany(Product, {
  foreignKey: 'category_id',
  onDelete: 'SET NULL',
});

Product.belongsTo(Category, {
  foreignKey: 'category_id',
});

// Изображения товаров
Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});

ProductImage.belongsTo(Product, {
  foreignKey: 'product_id',
});

// Пользователь → Корзина
User.hasMany(Cart, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Cart.belongsTo(User, {
  foreignKey: 'user_id',
});

// Товар → Корзина
Product.hasMany(Cart, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});

Cart.belongsTo(Product, {
  foreignKey: 'product_id',
});

// Пользователь → Избранное
User.hasMany(Favorite, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Favorite.belongsTo(User, {
  foreignKey: 'user_id',
});

// Товар → Избранное
Product.hasMany(Favorite, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});

Favorite.belongsTo(Product, {
  foreignKey: 'product_id',
});

// Пользователь → Заказы
User.hasMany(Order, {
  foreignKey: 'user_id',
  onDelete: 'RESTRICT',
});

Order.belongsTo(User, {
  foreignKey: 'user_id',
});

// Заказ → Товары
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
});

// Товар → OrderItem
Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  onDelete: 'RESTRICT',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
});

// Оплата
Order.hasOne(Payment, {
  foreignKey: 'order_id',
  onDelete: 'RESTRICT',
});

Payment.belongsTo(Order, {
  foreignKey: 'order_id',
});

// Доставка
Order.hasOne(Delivery, {
  foreignKey: 'order_id',
  onDelete: 'RESTRICT',
});

Delivery.belongsTo(Order, {
  foreignKey: 'order_id',
});

// Отзывы
User.hasMany(Review, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Review.belongsTo(User, {
  foreignKey: 'user_id',
});

Product.hasMany(Review, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});

Review.belongsTo(Product, {
  foreignKey: 'product_id',
});

// Вопросы
User.hasMany(Question, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Question.belongsTo(User, {
  foreignKey: 'user_id',
});

Product.hasMany(Question, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE',
});

Question.belongsTo(Product, {
  foreignKey: 'product_id',
});

// Ответ администратора
Question.belongsTo(User, {
  as: 'answeredByUser',
  foreignKey: 'answered_by',
});

// Экспорт
module.exports = {
  sequelize,
  Sequelize,

  User,
  Category,
  Product,
  ProductImage,
  Cart,
  Favorite,
  Order,
  OrderItem,
  Payment,
  Delivery,
  Review,
  Question,
  Faq,
  AboutPage,
};