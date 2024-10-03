const express = require('express');
const {
    startShift,
    endShift,
    // getSalesByDate,
    // getSalesByShift,
    // getSalesBySalesPerson
} = require('../../controllers/POS/pos'); // Import the controller functions

const router = express.Router();
const {protect, isSalesMan} = require('../../middleware/auth')

// Route to start a shift
router.post('/start-shift', protect, isSalesMan, startShift);

// Route to end a shift
router.post('/end-shift', protect, isSalesMan, endShift);

// // Route to get sales by a particular date (admin inquiry)
// router.get('/sales/date', getSalesByDate);

// // Route to get sales by a particular shift (admin inquiry)
// router.get('/sales/shift/:shift_id', getSalesByShift);

// // Route to get sales made by a particular salesperson in a particular month (admin inquiry)
// router.get('/sales/salesperson/:user_id/month/:month', getSalesBySalesPerson);

module.exports = router;
