const express = require('express');
const { getSaleBySSN } = require('../../controllers/POS-v2/returnSoldProduct');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();

router.post('/:ssn', protect, isSalesMan, getSaleBySSN); 

module.exports = router; 