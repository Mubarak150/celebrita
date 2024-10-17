const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');
const Ticket = require('./Ticket');
const User = require('./User');

const TicketMessage = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Ticket,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    sender_id: { // id, either of a user or an admin
      type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE' 
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,  // The message content
    },
    images: {
        type: DataTypes.STRING,
        allowNull: true, 
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,  // just to know whether the message was sent by an admin
    },
  }, {
    tableName: 'ticketmessages',
    timestamps: true,  
  });

  module.exports = TicketMessage; 


  