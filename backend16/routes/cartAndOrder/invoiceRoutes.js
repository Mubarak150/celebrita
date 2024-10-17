const express = require('express');
const router = express.Router();
const { getInvoice, getAllInvoices } = require('../../controllers/cartAndOrder/invoiceController');
const {protect, isUserAdmin} = require('../../middleware/auth')

// order Routes
router.get('/:order_id', protect, getInvoice); // get each invoice by its order id
router.get('/', protect, getAllInvoices); // get all invoices. for admins and users.. admin see all invoices.. users see only theirs.

module.exports = router;
