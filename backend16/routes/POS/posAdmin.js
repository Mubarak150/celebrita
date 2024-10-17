const express = require('express');
const {
    getShiftsByVendorAndDate,
    getSalesByDate,
    getSalesByShift,
    getSalesByVendor
} = require('../../controllers/POS/pos'); // Import the controller functions

const router = express.Router();
const {protect, isUserAdmin} = require('../../middleware/auth')

// admin routes: 
// shifts by a particular salesperson on a particular date. 
router.get('/shifts/vendor/:user_id/date/:date', protect, isUserAdmin, getShiftsByVendorAndDate); // done

// total sales in a day: 
router.get('/date', protect, isUserAdmin, getSalesByDate); // in progress.

// get sales of one shift
router.get('/shift/:shift_id', protect, isUserAdmin, getSalesByShift);

// get sales of a vendor in a month
router.get('/vendor/:user_id/month/:month', protect, isUserAdmin, getSalesByVendor);

module.exports = router;