require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { startBot } = require('./bot');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к MySQL установлено');

    await sequelize.sync({ alter: true });
    console.log('✅ Модели синхронизированы');

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });

    // Бот запускается после сервера
    await startBot();

  } catch (error) {
    console.error('❌ Ошибка запуска:', error);
    process.exit(1);
  }
}

start();