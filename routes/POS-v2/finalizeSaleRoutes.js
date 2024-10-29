const express = require('express');
const { finalizeSale, getInvoice } = require('../../controllers/POS-v2/finalizeSale');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();
 

// POST: create sale from cart: 
router.post('/', protect, isSalesMan, finalizeSale);

router.get('/invoice/:id', protect, isSalesMan, getInvoice);

module.exports = router; 