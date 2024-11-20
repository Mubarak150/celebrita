const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db')
const Category = require('./Category')

const Product = sequelize.define('Product', { // 
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // future dev:  Adjust precision and scale as needed
    allowNull: false
  },
  wholesale_price: { // let's not change this name... and this would be THE PRICE AT WHICH THE PRICE WAS PURCHASED BY THE OWNER.
    type: DataTypes.DECIMAL(10, 2), // future dev:  Adjust precision and scale as needed
    allowNull: false
  },
  discount: { // only for price, that is retail price.
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  manufacturing_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  returned_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),  // specific values
    defaultValue: 'active'  // set a default value
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Category, 
      key: 'id'
    },
    onDelete: 'CASCADE' // Delete products when the category is deleted
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: true
});

Product.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = Product;