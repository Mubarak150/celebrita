const express = require('express');
const { createPatientByReceptionist, updatePatientbyDoctor, updatePatientAtReception, getPendingPatients, getAllPatients, getPatientById, setPatientToActive, getActivePatient, deletePatient } = require('../../controllers/reception/patientsController');
const {protect, isReceptionist, isDoctor} = require('../../middleware/auth')
const router = express.Router();
 
// POPULATING AND MANIPULATING PATIENT: 
// POST: Create a new patient isReceptionist
router.post('/', protect, isReceptionist, createPatientByReceptionist);

// PATCH: Update a patient's procedure charges, next appointment, and status
router.patch('/:id', protect, isDoctor, updatePatientbyDoctor);

router.patch('/:id/reception', protect, isReceptionist, updatePatientAtReception);

// // GET: Get all  patients based on a date... set default to TODAY
router.get('/', protect, getAllPatients);

// GET: get single patient... 
router.get('/:id', protect, getPatientById);

// DELETE: DELETE single patient... 
router.delete('/:id', protect, isReceptionist, deletePatient);



// ABOUT QUEUE:
// PATCH: doctor setting pateint as active
router.patch('/:id/active', protect, isDoctor, setPatientToActive);

// GET: receptionist fetching active patient number. 
router.get('/active/queue', protect, getActivePatient);

module.exports = router;
