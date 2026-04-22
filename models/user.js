// models/user.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin','staff','owner','user'), defaultValue: 'user' },
  canteen_id: { type: DataTypes.INTEGER, allowNull: true } // Associate owner/staff with a canteen
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});

module.exports = User;
