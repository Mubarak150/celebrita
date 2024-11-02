// sale_return_products.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SaleReturnProduct = sequelize.define('SaleReturnProduct', {
    sale_return_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sale_returns', // Reference to the SaleReturn table
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pos_sale_products', // Reference to sale return products table
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false // Quantity of the product returned
    },
    refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false // Refund amount per product after proportional discount calculation
    }
}, {
    tableName: 'sale_return_products',
    timestamps: true,
    underscored: true,
});

module.exports = SaleReturnProduct;
