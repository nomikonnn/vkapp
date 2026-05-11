const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AboutPage extends Model {}

  AboutPage.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    address: DataTypes.STRING(500),
    latitude: DataTypes.DECIMAL(10,7),
    longitude: DataTypes.DECIMAL(10,7),
    phone: DataTypes.STRING(50),
    email: DataTypes.STRING(150),
    working_hours: DataTypes.STRING(200),
    social_links: DataTypes.JSON,
  }, {
    sequelize,
    modelName: 'AboutPage',
    tableName: 'about_page',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: false,
    underscored: true,
  });

  return AboutPage;
};