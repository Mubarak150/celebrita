
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const POSSale = sequelize.define( 'POSSale', {
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    sale_number: {
        type: DataTypes.STRING, // or DataTypes.INTEGER if it's a number sequence
        allowNull: false,
        unique: true // Ensures each sale number is unique
    },
    buyer_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    buyer_contact: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sub_total_amount: {
        type: DataTypes.DECIMAL(10, 2), // Decimal type for monetary values
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2), // Store discount as a flat or calculated amount
        allowNull: true
    },
    discounted_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_method: {
        type: DataTypes.ENUM('card', 'cash'), // Enum field with "card" or "cash" options
        allowNull: false
    }
}, {
    tableName: 'pos_sales',
    timestamps: true,
    underscored: true,
});

module.exports = POSSale;
