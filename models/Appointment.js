const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: { model: User, key: 'id' }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
});

Appointment.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Appointment;
