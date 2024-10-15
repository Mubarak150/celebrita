const express = require('express');
const { createPatient, updatePatient, getPendingPatients } = require('../../controllers/reception/patientsController');
const {protect, isReceptionist} = require('../../middleware/auth')
const router = express.Router();
 
// POST: Create a new patient isReceptionist
router.post('/', protect, isReceptionist, createPatient);

// PUT: Update a patient's procedure charges, next appointment, and status
router.patch('/:id', protect, isReceptionist, updatePatient);

// GET: Get all  with status 'pending'
router.get('/', protect, isReceptionist, getPendingPatients);

module.exports = router;
