const express = require('express');
const { getAllProductsAtPOS } = require('../../controllers/POS-v2/products');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();
 

// POST: get all active products: 
router.get('/', protect, isSalesMan, getAllProductsAtPOS);

// // PATCH: Update a patient's procedure charges, next appointment, and status
// router.patch('/:id', protect, isDoctor, updatePatientbyDoctor);

// // PATCH: Update a patient at reception
// router.patch('/:id/reception', protect, isReceptionist, updatePatientAtReception);

// POST: close a patient isReceptionist

module.exports = router;