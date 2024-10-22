const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a new Sequelize instance
const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD || null, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql', 
    port: process.env.MYSQL_PORT,
    // from down this line: it is to ensure that time is stored in pakistan time. plus: and to ensure that the date does not undergo UTC conversions at retrieval time. 
    timezone: '+05:00', // PST = UTC +5;
    dialectOptions: {
    dateStrings: true,  // Ensure dates are returned as strings
    typeCast: function (field, next) {
      // for reading from the database
      if (field.type === 'DATETIME') {
        return field.string();
      }
      return next();
    }
  }
});

// Test the connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connected');
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
