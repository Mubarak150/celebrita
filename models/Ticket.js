const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const User = require('./User');

const Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,  // heree comes the subject of the ticket
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    status: {
      type: DataTypes.ENUM('open', 'answered', 'on-hold', 'in-progress', 'closed'),
      defaultValue: 'open',
    },
  }, {
    tableName: 'tickets',
    timestamps: true
  });

  module.exports = Ticket; 
  