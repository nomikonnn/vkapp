// backend/models/index.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Поддержка переменных Railway (MYSQL*) и стандартных (DB_*)
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway';
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || 3306;

// Проверка только пароля (он не должен быть пустым)
if (!dbPassword) {
  console.error('❌ Отсутствует DB_PASSWORD или MYSQLPASSWORD');
  console.error('Установите переменную окружения с паролем от БД');
  process.exit(1);
}

console.log('🔧 Подключение к БД:');
console.log('  Host:', dbHost);
console.log('  Port:', dbPort);
console.log('  Database:', dbName);
console.log('  User:', dbUser);

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
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

// Импорт всех моделей (СНАЧАЛА ИМПОРТ!)
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

// Вызов associate для всех моделей (ПОСЛЕ ИМПОРТА!)
Object.keys(sequelize.models).forEach((modelName) => {
  if (sequelize.models[modelName].associate) {
    sequelize.models[modelName].associate(sequelize.models);
  }
});

// Определение связей
Product.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Product, { foreignKey: 'category_id' });

User.hasMany(Cart, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Favorite, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Order, { foreignKey: 'user_id', onDelete: 'RESTRICT' });
User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Question, { foreignKey: 'user_id', onDelete: 'CASCADE' });

Product.hasMany(Cart, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasMany(Favorite, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasMany(OrderItem, { foreignKey: 'product_id', onDelete: 'RESTRICT' });
Product.hasMany(Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasMany(Question, { foreignKey: 'product_id', onDelete: 'CASCADE' });

Cart.belongsTo(User, { foreignKey: 'user_id' });
Cart.belongsTo(Product, { foreignKey: 'product_id' });

Favorite.belongsTo(User, { foreignKey: 'user_id' });
Favorite.belongsTo(Product, { foreignKey: 'product_id' });

Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

Order.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(OrderItem, { 
  foreignKey: 'order_id', 
  onDelete: 'CASCADE',
  as: 'items'
});
Order.hasOne(Payment, { 
  foreignKey: 'order_id', 
  onDelete: 'RESTRICT',
  as: 'payment'
});
Order.hasOne(Delivery, { 
  foreignKey: 'order_id', 
  onDelete: 'RESTRICT',
  as: 'delivery'
});

Payment.belongsTo(Order, { foreignKey: 'order_id' });
Delivery.belongsTo(Order, { foreignKey: 'order_id' });

Question.belongsTo(User, { foreignKey: 'user_id' });
Question.belongsTo(Product, { foreignKey: 'product_id' });


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