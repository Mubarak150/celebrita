// sale_returns.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SaleReturn = sequelize.define('SaleReturn', {
    sale_return_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Unique SRN format like SRN-00000000001
    },
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pos_sales', // Reference to POSSale model
            key: 'id'
        },
        onDelete: 'CASCADE' // Optional: delete sale products if the sale is deleted
    },
    sales_number: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'pos_sales', // Reference to sales table
            key: 'sale_number'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    return_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW // Automatically set return date
    },
    total_refund: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false // Refund amount for the entire return
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true // Optional remarks about the return
    }
}, {
    tableName: 'sale_returns',
    timestamps: true,
    underscored: true,
});

module.exports = SaleReturn;
