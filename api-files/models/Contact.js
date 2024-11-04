const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');


const Contact = sequelize.define('Contact', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name' // maps to 'first_name' column in your table
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name' // maps to 'last_name' column in your table
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true // Validates that the value is a valid email address
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'contact', // table name in the database
  timestamps: true, // automatically adds createdAt and updatedAt columns
});

module.exports = Contact;
