const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');
const User = require('./User')
const Order = require('./Order')

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order, 
      key: 'id',
    },
    onUpdate: 'CASCADE',  // Update invoice's order_id if order id changes
    onDelete: 'CASCADE',  // Delete invoice if order is deleted
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,  
  },
  delivery_charges: {
    type: DataTypes.STRING,
    allowNull: false,  
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,  
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),  // Payment status options
    allowNull: false,
    defaultValue: 'pending',  // Default payment status to 'pending'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,  // Automatically use current timestamp
  },
}, {
  tableName: 'invoices',  // Specify table name if different from model name
  timestamps: false,  // Disable automatic timestamps (updatedAt)
});

module.exports = Invoice;
