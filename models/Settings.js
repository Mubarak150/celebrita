const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Settings = sequelize.define("Settings", {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.INTEGER, // Assuming threshold is an integer
      allowNull: false,
    },
  }, {
    timestamps: false,
    tableName: 'settings'
});

  module.exports = Settings;