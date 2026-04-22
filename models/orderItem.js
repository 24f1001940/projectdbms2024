const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('order_item', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  order_id: { type: DataTypes.INTEGER, allowNull: false },

  item_id: { type: DataTypes.INTEGER, allowNull: false },

  quantity: { type: DataTypes.INTEGER, allowNull: false },

  unit_price: { type: DataTypes.DECIMAL(10,2), allowNull: false }
}, {
  timestamps: true,
  underscored: true
});

module.exports = OrderItem;
