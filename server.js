require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Connection to MySQL has been established successfully.');
    
    // Синхронизация всех моделей с базой данных (создаст таблицы, если их нет)
    await sequelize.sync({ alter: true }); // для разработки; в продакшене заменить на миграции
    console.log('All models were synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

start();