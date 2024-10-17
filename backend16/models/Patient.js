const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');
const moment = require('moment'); // For easier date manipulation

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
        defaultValue: DataTypes.NOW,
    },
    fees: {
        type: DataTypes.INTEGER,
        allowNull: true, // optional 
    },
    procedure_name: {
        type: DataTypes.STRING,
        allowNull: true, // optional 
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
    patient_number: {
        type: DataTypes.STRING, // Example format: '001'
        allowNull: true,
    },
}, {
    tableName: 'patients',
    timestamps: true, // Adds createdAt and updatedAt
});

// Hook to generate patient_number before creating a new patient
Patient.beforeCreate(async (patient, options) => {
    // Get the start of the current day (12:00 AM)
    const todayStart = moment().startOf('day').toDate();

    // Find the last patient created today
    const lastPatientToday = await Patient.findOne({
        where: {
            createdAt: {
                [Op.gte]: todayStart // Find patients created today
            }
        },
        order: [['createdAt', 'DESC']] // Order by latest created
    });

    // If no patient was created today, set the number to '001'
    let newPatientNumber = '001';

    if (lastPatientToday) {
        // Increment the patient number
        const lastPatientNumber = parseInt(lastPatientToday.patient_number, 10);
        newPatientNumber = String(lastPatientNumber + 1).padStart(3, '0'); // Pad the number with leading zeros
    }

    // Assign the new patient number to the patient
    patient.patient_number = newPatientNumber;
});

module.exports = Patient;
