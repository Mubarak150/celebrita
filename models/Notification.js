const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, 
      key: 'id',
    },
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  is_seen: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  
},{
  tableName: 'notifications'
});

module.exports = Notification;
