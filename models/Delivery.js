const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Delivery extends Model {}

  Delivery.init({
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
    type: {
      type: DataTypes.ENUM('courier','post'),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    delivery_date: DataTypes.DATEONLY,
    time_window: DataTypes.STRING(50),
    tracking_number: DataTypes.STRING(100),
    status: {
      type: DataTypes.ENUM('pending','in_transit','delivered'),
      defaultValue: 'pending',
    },
    notes: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Delivery',
    tableName: 'delivery',
    timestamps: false,
    underscored: true,
  });

  return Delivery;
};