const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailVerificationToken = sequelize.define(
  'EmailVerificationToken',
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
    tokenHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'email_verification_tokens',
  }
);

module.exports = EmailVerificationToken;