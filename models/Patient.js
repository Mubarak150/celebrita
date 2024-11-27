const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');
const moment = require('moment'); // For easier date manipulation

const Patient = sequelize.define('Patient', {
    // entries by receptionist
    patient_number: {
        type: DataTypes.STRING, // Example format: '001'
        allowNull: true,
    },
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
    contact: { // cell number. 
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    fee_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false, // optional 
    },
    // entries by doctor
    procedure_name: {
        type: DataTypes.STRING,
        allowNull: true, // optional 
    },
    procedure_charges: {
        type: DataTypes.INTEGER,
        allowNull: true, // Optional field
    },
    comments: {
        type: DataTypes.STRING,
        allowNull: true, // Optional field
    },
    prescription: {
        type: DataTypes.TEXT,
        allowNull: true, // Optional field
    },
    next_appointment: {
        type: DataTypes.DATE,
        allowNull: true, // Optional field
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'billing', 'closed'),
        allowNull: false,
        defaultValue: 'pending',
    },
    
}, {
    tableName: 'patients',
    timestamps: true, // Adds createdAt and updatedAt
});

Patient.beforeCreate(async (patient, options) => {
    // Extract date part from patient's createdAt
    const patientCreatedAt = new Date(patient.createdAt);
    const dayStart = new Date(patientCreatedAt);
    dayStart.setHours(0, 0, 0, 0); // Start of the day
    const dayEnd = new Date(patientCreatedAt);
    dayEnd.setHours(23, 59, 59, 999); // End of the day

    // Find the last patient created on the same day as patient.createdAt
    const lastPatient = await Patient.findOne({
        where: {
            createdAt: {
                [Op.gte]: dayStart, // Same day start
                [Op.lte]: dayEnd,   // Same day end
            }
        },
        order: [['createdAt', 'DESC']], // Order by latest 'createdAt'
    });

    let newPatientNumber = '001'; // Default to '001' if no patients for that day

    if (lastPatient) {
        const lastPatientNumber = parseInt(lastPatient.patient_number, 10);
        newPatientNumber = String(lastPatientNumber + 1).padStart(3, '0'); // Increment and pad
    }

    // Assign the new patient number
    patient.patient_number = newPatientNumber;
});




module.exports = Patient;
