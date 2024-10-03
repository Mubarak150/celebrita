const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
// const Warehouse = require('./Warehouse'); // Import the Warehouse model

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: { // role not to be taken from front end... but manually insert it for admins or may come out with some other solution in admin panel. 
        type: DataTypes.ENUM('1', '2', '3'),
        allowNull: false,
        defaultValue: '2'
    },
    otp: {
        type: DataTypes.INTEGER, 
        allowNull: true
    }, 
    otp_expiry: {
        type: DataTypes.TIME, 
        allowNull: true
    }
    
}, {
    tableName: 'users',
    timestamps: true // Automatically add createdAt and updatedAt fields
});



module.exports = User;

