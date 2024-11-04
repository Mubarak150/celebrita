const express = require('express');
const { todaySalesAndReturns } = require('../../controllers/POS-v2/todaySalesAndReturns');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();
 

// get
router.get('/', protect, isSalesMan, todaySalesAndReturns);



module.exports = router;