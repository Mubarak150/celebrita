const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {  // Salesperson ID
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id',
        },
        allowNull: false,
    },
    sale_in_shift: {
        type: DataTypes.FLOAT,
        allowNull: false,  // Total amount of sale in a shift
    },
    shift_start: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    shift_end: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        allowNull: false,
        defaultValue: 'open'
    }
}, {
    timestamps: true,
    tableName: 'shifts'
});

module.exports = Shift;
