const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {}

  Payment.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    method: {
      type: DataTypes.ENUM('cash','card_online'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending','processing','completed','failed'),
      defaultValue: 'pending',
    },
    external_id: DataTypes.STRING(255),
    paid_at: DataTypes.DATE,
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: false,
    underscored: true,
  });

  return Payment;
};