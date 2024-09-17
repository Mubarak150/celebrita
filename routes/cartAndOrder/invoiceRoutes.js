const express = require('express');
const router = express.Router();
const { getInvoice } = require('../../controllers/cartAndOrder/invoiceController');
const {protect} = require('../../middleware/auth')

// order Routes
router.get('/:order_id', protect, getInvoice);

module.exports = router;
