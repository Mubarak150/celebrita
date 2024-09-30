const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db')
const Category = require('./Category')

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // future dev:  Adjust precision and scale as needed
    allowNull: false
  },
  discount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  returned_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  }
}, {
  tableName: 'products',
  timestamps: true
});

Product.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = Product;