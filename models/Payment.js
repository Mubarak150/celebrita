const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db')
const Appointment = require('./Appointment');
const User = require('./User');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    references: { model: Appointment, key: 'id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: { model: User, key: 'id' }
  },
  payment_method: {
    type: DataTypes.ENUM('manual', 'PayFast'),
    allowNull: false
  },
  tracking_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  account_details: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_proof: {
    type: DataTypes.STRING, // URL to the uploaded file
    allowNull: true
  }
}, {
  tableName: 'payments'
});

Payment.belongsTo(Appointment, { foreignKey: 'appointment_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Payment;
