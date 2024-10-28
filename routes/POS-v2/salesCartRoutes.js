const express = require('express');
const { addToSalesCart, fetchSalesCart } = require('../../controllers/POS-v2/salesCart');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();
 

// POST: 
router.post('/:barcode', protect, isSalesMan, addToSalesCart);

router.get('/', protect, isSalesMan, fetchSalesCart);



module.exports = router;