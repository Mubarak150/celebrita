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
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,  // Default to current timestamp on creation
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,  // Default to current timestamp, updated manually
    allowNull: false,
  }
}, {
  timestamps: true 
});

module.exports = Category;