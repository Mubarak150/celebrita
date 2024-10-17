const express = require('express');
const { createPatientByReceptionist, updatePatientbyDoctor, getPendingPatients, getClosedPatients } = require('../../controllers/reception/patientsController');
const {protect, isReceptionist, isDoctor} = require('../../middleware/auth')
const router = express.Router();
 
// POST: Create a new patient isReceptionist
router.post('/', protect, isReceptionist, createPatientByReceptionist);

// PUT: Update a patient's procedure charges, next appointment, and status
router.patch('/:id', protect, isDoctor, updatePatientbyDoctor);

// GET: Get all  with status 'pending'
router.get('/pending', protect, getPendingPatients);
router.get('/closed', protect, isDoctor, getClosedPatients);

module.exports = router;
