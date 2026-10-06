const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecurringTransaction = sequelize.define(
  'RecurringTransaction',
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
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dayOfMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 31 },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Tracks the most recent month/year this template has already
    // generated a real income/expense record for, so the same month
    // never gets generated twice.
    lastGeneratedMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lastGeneratedYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'recurring_transactions',
  }
);

module.exports = RecurringTransaction;