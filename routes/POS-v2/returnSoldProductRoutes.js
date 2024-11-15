const express = require('express');
const { getSaleBySSN, processReturn, getSaleBySSNforPopUp } = require('../../controllers/POS-v2/returnSoldProduct');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();


router.post('/:ssn', protect, isSalesMan, getSaleBySSN);

router.post('/:ssn/pop-up', protect, isSalesMan, getSaleBySSNforPopUp);

router.post('/ammend/process', protect, isSalesMan, processReturn);


module.exports = router; 