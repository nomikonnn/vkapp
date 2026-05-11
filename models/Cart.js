const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    static associate(models) {
      Cart.belongsTo(models.User, { foreignKey: 'user_id' });
      Cart.belongsTo(models.Product, { foreignKey: 'product_id' });
    }
  }

  Cart.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.MEDIUMINT.UNSIGNED,
      defaultValue: 1,
    },
    added_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'Cart',
    tableName: 'cart',
    timestamps: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'product_id'] },
      { fields: ['user_id'] },
      { fields: ['product_id'] },
    ],
  });

  return Cart;
};