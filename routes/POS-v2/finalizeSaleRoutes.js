const express = require('express');
const { finalizeSale } = require('../../controllers/POS-v2/finalizeSale');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();
 

// POST: get all active products: 
router.post('/', protect, isSalesMan, finalizeSale);

module.exports = router; 