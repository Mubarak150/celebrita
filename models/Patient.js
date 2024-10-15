const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Patient = sequelize.define('Patient', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    procedure_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fees: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    procedure_charges: {
        type: DataTypes.INTEGER,
        allowNull: true, // Optional field
    },
    next_appointment: {
        type: DataTypes.DATE,
        allowNull: true, // Optional field
    },
    status: {
        type: DataTypes.ENUM('pending', 'closed'),
        allowNull: false,
        defaultValue: 'pending',
    },
}, {
    tableName: 'patients',
    timestamps: true, // Adds createdAt and updatedAt
});

module.exports = Patient;
