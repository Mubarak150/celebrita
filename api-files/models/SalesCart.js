const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SalesCart = sequelize.define('SalesCart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'sales_carts',
  timestamps: true
});

module.exports = SalesCart;
