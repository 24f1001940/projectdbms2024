const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Canteen = sequelize.define('canteen', {
  id: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
  name: { type: DataTypes.STRING, allowNull:false },
  location: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
});
module.exports = Canteen;
