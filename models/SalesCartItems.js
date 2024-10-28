const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SalesCart = require('./SalesCart')
const Product = require('./Product')

const SalesCartItem = sequelize.define('SalesCartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sales_cart_id: {
    type: DataTypes.INTEGER,
    references: {
      model: SalesCart,
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  product_barcode: {
    type: DataTypes.STRING, 
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Product,
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'sales_cart_items',
  timestamps: true
});

SalesCartItem.belongsTo(SalesCart, { foreignKey: 'sales_cart_id' });
SalesCartItem.belongsTo(Product, { foreignKey: 'product_id' });
module.exports = SalesCartItem;
