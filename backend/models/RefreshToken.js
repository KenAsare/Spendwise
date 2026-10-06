const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Stores a SHA-256 hash of each refresh token, never the raw value,
// so a database leak alone can't be used to impersonate a session.
const RefreshToken = sequelize.define(
  'RefreshToken',
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
    tableName: 'refresh_tokens',
  }
);

module.exports = RefreshToken;