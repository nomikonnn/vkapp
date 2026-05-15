// backend/models/index.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Проверка обязательных переменных окружения
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Отсутствуют обязательные переменные окружения:', missingVars.join(', '));
  console.error('Пожалуйста, настройте переменные в файле .env или в настройках хостинга');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
    console.error('❌ Ошибка подключения к базе данных:', err.message);
  });

// Импорт всех моделей
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Category = require('./Category')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const ProductImage = require('./ProductImage')(sequelize, Sequelize.DataTypes);
const Cart = require('./Cart')(sequelize, Sequelize.DataTypes);
const Favorite = require('./Favorite')(sequelize, Sequelize.DataTypes);
const Order = require('./Order')(sequelize, Sequelize.DataTypes);
const OrderItem = require('./OrderItem')(sequelize, Sequelize.DataTypes);
const Payment = require('./Payment')(sequelize, Sequelize.DataTypes);
const Delivery = require('./Delivery')(sequelize, Sequelize.DataTypes);
const Review = require('./Review')(sequelize, Sequelize.DataTypes);
const Question = require('./Question')(sequelize, Sequelize.DataTypes);
const Faq = require('./Faq')(sequelize, Sequelize.DataTypes);
const AboutPage = require('./AboutPage')(sequelize, Sequelize.DataTypes);

// Определение связей
User.hasMany(Cart, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Favorite, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Order, { foreignKey: 'user_id', onDelete: 'RESTRICT' });
User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Question, { foreignKey: 'user_id', onDelete: 'CASCADE' });

Product.hasMany(Cart, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasMany(Favorite, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', onDelete: 'RESTRICT' });
Product.hasMany(Question, { foreignKey: 'product_id', onDelete: 'CASCADE' });

Cart.belongsTo(User, { foreignKey: 'user_id' });
Cart.belongsTo(Product, { foreignKey: 'product_id' });

Favorite.belongsTo(User, { foreignKey: 'user_id' });
Favorite.belongsTo(Product, { foreignKey: 'product_id' });

Order.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
Order.hasOne(Payment, { foreignKey: 'order_id', onDelete: 'RESTRICT' });
Order.hasOne(Delivery, { foreignKey: 'order_id', onDelete: 'RESTRICT' });

OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Payment.belongsTo(Order, { foreignKey: 'order_id' });
Delivery.belongsTo(Order, { foreignKey: 'order_id' });

Question.belongsTo(User, { foreignKey: 'user_id' });
Question.belongsTo(Product, { foreignKey: 'product_id' });
Question.belongsTo(User, { as: 'answeredByUser', foreignKey: 'answered_by' });

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
