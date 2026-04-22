// models/user.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin', 'owner'), defaultValue: 'user' },
  canteen_id: { type: DataTypes.INTEGER, allowNull: true },
  avatar: { type: DataTypes.STRING, allowNull: true },
  email_verified: { type: DataTypes.BOOLEAN, defaultValue: true },
  email_verification_token: { type: DataTypes.STRING, allowNull: true },
  email_verification_expires: { type: DataTypes.DATE, allowNull: true },
  refresh_token_hash: { type: DataTypes.STRING, allowNull: true },
  refresh_token_expires: { type: DataTypes.DATE, allowNull: true },
  token_version: { type: DataTypes.INTEGER, defaultValue: 0 },
  reset_token_hash: { type: DataTypes.STRING, allowNull: true },
  reset_expires: { type: DataTypes.DATE, allowNull: true },
  password_changed_at: { type: DataTypes.DATE, allowNull: true },
  last_login_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});

module.exports = User;
