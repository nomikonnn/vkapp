// Question.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.User, { foreignKey: 'user_id' });
      Question.belongsTo(models.Product, { foreignKey: 'product_id' });
      Question.belongsTo(models.User, { as: 'answeredByUser', foreignKey: 'answered_by' });
    }
  }

  Question.init({
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
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    answered_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    answered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Question',
    tableName: 'questions',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['product_id'] },
      { fields: ['user_id'] },
    ],
  });

  return Question;
};