const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db')
// const Category = require('./Category')

const Test = sequelize.define('Test', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: false
  }
})

module.exports = Test;