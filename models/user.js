// models/user.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'owner', 'user'), defaultValue: 'user' },
  canteen_id: { type: DataTypes.INTEGER, allowNull: true },
  avatar: { type: DataTypes.STRING, allowNull: true },
  refresh_token: { type: DataTypes.TEXT, allowNull: true },
  reset_token: { type: DataTypes.STRING, allowNull: true },
  reset_expires: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});

module.exports = User;
