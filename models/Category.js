const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  d_url: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),  // specific values
    defaultValue: 'active'  // set a default value
  }
}, {
  timestamps: true 
});

module.exports = Category;