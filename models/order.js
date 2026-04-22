const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  user_id: { type: DataTypes.INTEGER, allowNull: false },

  canteen_id: { type: DataTypes.INTEGER, allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  payment_method: { type: DataTypes.STRING, allowNull: true },
  status: { 
    type: DataTypes.ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled'), 
    defaultValue: 'pending' 
  },
  note: { type: DataTypes.TEXT, allowNull: true }
}, {
  timestamps: true,
  underscored: true
});

module.exports = Order;
