const express = require('express');
const { createPatientByReceptionist, updatePatientbyDoctor, getPendingPatients, getAllPatients, getPatientById, setPatientToActive, getActivePatient } = require('../../controllers/reception/patientsController');
const {protect, isReceptionist, isDoctor} = require('../../middleware/auth')
const router = express.Router();
 
// POST: Create a new patient isReceptionist
router.post('/', protect, isReceptionist, createPatientByReceptionist);

// PUT: Update a patient's procedure charges, next appointment, and status
router.patch('/:id', protect, isDoctor, updatePatientbyDoctor);

// // GET: Get all  patients based on a date... set default to TODAY
router.get('/', protect, getAllPatients);
// router.get('/closed', protect, isDoctor, getClosedPatients);

// get single patient... 
router.get('/:id', protect, isDoctor, getPatientById);

// ABOUT QUEUE:
// doctor setting pateint as active
router.patch('/:id/active', protect, isDoctor, setPatientToActive);
// receptionist fetching active patient number. 
router.get('/active/queue', protect, getActivePatient);

module.exports = router;
