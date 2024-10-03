const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Shift = require('./Shift.js');
const Product = require('./Product');

const ShiftSale = sequelize.define('ShiftSale', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    shift_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Shift,
            key: 'id',
        },
        allowNull: false,
    },
    product_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Product,
            key: 'id',
        },
        allowNull: false,
    },
    price_at_sale: {
        type: DataTypes.FLOAT,
        allowNull: false,  // Price of the product at the time of sale
    },
    sold_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'shift_sales'
});

module.exports = ShiftSale;
