
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const POSSaleProduct = sequelize.define( 'POSSaleProduct',{
    sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pos_sales', // Reference to POSSale model
            key: 'id'
        },
        onDelete: 'CASCADE' // Optional: delete sale products if the sale is deleted
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products', // Reference to Product model (adjust table name if necessary)
            key: 'id'
        },
        onDelete: 'CASCADE' // Optional: delete sale product if the product is deleted
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1 // Ensures quantity is at least 1
        }
    },
    price_at_sale: {
        type: DataTypes.DECIMAL(10, 2), // Storing the price at the time of order
        allowNull: false
    }
}, {
    tableName: 'pos_sale_products',
    timestamps: true,
    underscored: true,
});

module.exports = POSSaleProduct;
