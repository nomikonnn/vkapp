const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Favorite extends Model {
    static associate(models) {
      Favorite.belongsTo(models.User, { foreignKey: 'user_id' });
      Favorite.belongsTo(models.Product, { foreignKey: 'product_id' });
    }
  }

  Favorite.init({
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
    added_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
    timestamps: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'product_id'] },
      { fields: ['user_id'] },
    ],
  });

  return Favorite;
};