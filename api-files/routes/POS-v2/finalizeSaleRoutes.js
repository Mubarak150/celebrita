const express = require('express');
const { finalizeSale, getInvoice } = require('../../controllers/POS-v2/finalizeSale');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();
 

// POST: create sale from cart: 
router.post('/', protect, isSalesMan, finalizeSale);


// i wanted it to be GET..... but mudassir paki kaar pa shi ko
router.post('/invoice/:id', protect, isSalesMan, getInvoice);

module.exports = router; 