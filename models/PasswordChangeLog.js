const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const PasswordChangeLog = sequelize.define('PasswordChangeLog', {
    changed_by: {
        type: DataTypes.INTEGER,
        allowNull: false, // ID of the admin or sales manager changing the password
    },
    changed_by_name: {
        type: DataTypes.STRING,
        allowNull: false, // Name of the person changing the password
    },
    changed_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // ID of the user whose password is being changed
    },
    changed_user_name: {
        type: DataTypes.STRING,
        allowNull: false, // Name of the user whose password is being changed
    },
    change_time: {
        type: DataTypes.DATE,
        // defaultValue: Sequelize.NOW,
        allowNull: false, // Timestamp of when the password was changed
    },
}, {
    tableName: 'password_change_logs',
    timestamps: false,
    underscored: true,
});

module.exports = PasswordChangeLog;