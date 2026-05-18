// Order.js
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'user_id' });
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
      Order.hasOne(models.Payment, { foreignKey: 'order_id', as: 'payment' });
      Order.hasOne(models.Delivery, { foreignKey: 'order_id', as: 'delivery' });
    }
  }
  Order.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending','confirmed','paid','shipped','delivered','cancelled'),
      defaultValue: 'pending',
    },
    delivery_type: { type: DataTypes.ENUM('courier','post'), allowNull: false },
    delivery_address: { type: DataTypes.TEXT, allowNull: false },
    delivery_date: DataTypes.DATEONLY,
    delivery_time_window: DataTypes.STRING(50),
    payment_method: { type: DataTypes.ENUM('cash','card_online'), allowNull: false },
    original_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    discount_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    delivery_cost: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    note: DataTypes.TEXT,
    promo_code: DataTypes.STRING(50),   // для учёта применённого промокода
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    underscored: true,
  });
  return Order;
};