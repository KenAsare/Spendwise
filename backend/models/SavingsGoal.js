const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavingsGoal = sequelize.define(
  'SavingsGoal',
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currentAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    targetDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: 'savings_goals',
  }
);

module.exports = SavingsGoal;