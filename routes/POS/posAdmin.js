const express = require('express');
const {
    getShiftsBySalespersonAndDate,
    getSalesByDate,
    getSalesByShift,
    getSalesBySalesPerson
} = require('../../controllers/POS/pos'); // Import the controller functions

const router = express.Router();
const {protect, isUserAdmin} = require('../../middleware/auth')

// admin routes: 
// shifts by a particular salesperson on a particular date. 
router.get('/shifts/salesperson/:user_id', getShiftsBySalespersonAndDate);

router.get('/date', protect, isUserAdmin, getSalesByDate);

router.get('/shift/:shift_id', protect, isUserAdmin, getSalesByShift);

router.get('/salesperson/:user_id/month/:month', protect, isUserAdmin, getSalesBySalesPerson);

module.exports = router;