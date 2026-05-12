require('dotenv').config();
const bcrypt = require('bcrypt');
const { User, sequelize } = require('../models');

async function main() {
  await sequelize.authenticate();
  const hash = await bcrypt.hash('admin123', 10); // ← задайте свой пароль!

  const [user, created] = await User.findOrCreate({
    where: { email: 'admin@musicstore.ru' },
    defaults: {
      password: hash,
      role: 'admin',
      first_name: 'Admin',
      last_name: '',
    },
  });

  if (created) {
    console.log('Администратор создан: admin@musicstore.ru / admin123');
  } else {
    console.log('Администратор уже существует');
  }
  await sequelize.close();
}

main().catch(console.error);