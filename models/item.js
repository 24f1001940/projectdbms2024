const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Item = sequelize.define('item', {
  id: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
  name: { type: DataTypes.STRING, allowNull:false },
  category: { type: DataTypes.ENUM('snacks', 'drinks', 'meals'), defaultValue: 'meals' },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10,2), allowNull:false },
  image_path: { type: DataTypes.STRING },
  stock: { type: DataTypes.INTEGER, defaultValue:100 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue:true }
}, {
  underscored: true
});
module.exports = Item;
