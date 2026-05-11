const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
      Product.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images' });
      Product.hasMany(models.Review, { foreignKey: 'product_id', as: 'reviews' }); // если потребуется включать отзывы
    }
  }

  Product.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(300),
      allowNull: false,
      unique: true,
    },
    description: DataTypes.TEXT,
    specifications: DataTypes.JSON,
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    old_price: DataTypes.DECIMAL(10, 2),
    stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['category_id'] },
      { fields: ['price'] },
      { fields: ['name'] },
      { fields: ['is_active'] },
      { type: 'FULLTEXT', fields: ['name', 'description'] }, // опционально
    ],
  });

  return Product;
};