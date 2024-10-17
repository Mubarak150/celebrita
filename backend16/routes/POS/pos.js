const express = require('express');
const {
    startShift,
    endShift,
    getProductByBarcode,
} = require('../../controllers/POS/pos'); // Import the controller functions

const router = express.Router();
const {protect, isSalesMan} = require('../../middleware/auth')

// Route to start a shift
router.post('/start-shift', protect, isSalesMan, startShift);

// router.get('/get-products', protect, isSalesMan, getProducts);

// Route to end a shift
router.post('/end-shift', protect, isSalesMan, endShift);

// get product by barcode. 
router.get('/get-by-barcode', protect, isSalesMan, getProductByBarcode); 


module.exports = router;
