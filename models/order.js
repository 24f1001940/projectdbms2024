const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  user_id: { type: DataTypes.INTEGER, allowNull: false },

  canteen_id: { type: DataTypes.INTEGER, allowNull: false },

  total: { type: DataTypes.DECIMAL(10,2), allowNull: false },

  payment_method: { type: DataTypes.STRING, allowNull: true },

  status: { type: DataTypes.STRING, defaultValue: 'placed' },
}, {
  timestamps: true,
  underscored: true
});

module.exports = Order;
