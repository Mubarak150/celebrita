const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const Delivery = sequelize.define('Delivery', {
    city: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    charges: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    tableName: 'deliveries',
    timestamps: false 
});

module.exports = Delivery;
