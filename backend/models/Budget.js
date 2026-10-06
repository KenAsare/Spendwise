const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define(
  'Budget',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 12 },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'budgets',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'category', 'month', 'year'],
      },
    ],
  }
);

module.exports = Budget;
