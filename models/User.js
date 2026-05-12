const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}

  User.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vk_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,             // теперь может быть NULL для администраторов без VK
      unique: true,
    },
    first_name: DataTypes.STRING(100),
    last_name: DataTypes.STRING(100),
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,             // необязателен для VK‑пользователей
    },
    phone: DataTypes.STRING(20),
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,             // хранится bcrypt‑хэш, только для админов с паролем
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
    },
    avatar_url: DataTypes.STRING(500),
    address: DataTypes.STRING(500),
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
  });

  return User;
};