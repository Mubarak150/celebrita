const express = require('express');
const { createPatientByReceptionist, updatePatientbyDoctor, getPendingPatients, getAllPatients, getPatientById } = require('../../controllers/reception/patientsController');
const {protect, isReceptionist, isDoctor} = require('../../middleware/auth')
const router = express.Router();
 
// POST: Create a new patient isReceptionist
router.post('/', protect, isReceptionist, createPatientByReceptionist);

// PUT: Update a patient's procedure charges, next appointment, and status
router.patch('/:id', protect, isDoctor, updatePatientbyDoctor);

// // GET: Get all  patients based on a date... set default to TODAY
router.get('/', protect, getAllPatients);
// router.get('/closed', protect, isDoctor, getClosedPatients);

router.get('/:id', protect, getPatientById);

module.exports = router;
