const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Faq extends Model {}

  Faq.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'Faq',
    tableName: 'faq',
    timestamps: false,
    underscored: true,
  });

  return Faq;
};