const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Stores only a SHA-256 hash of each reset token, same principle as
// RefreshToken: a database leak alone can't be used to reset anyone's password.
const PasswordResetToken = sequelize.define(
  'PasswordResetToken',
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
    tableName: 'password_reset_tokens',
  }
);

module.exports = PasswordResetToken;