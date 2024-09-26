const express = require('express');
const paymentController = require('../../controllers/cartAndOrder/payOrderController');
const router = express.Router();

// Route for initiating the payment
router.post('/payment', paymentController.initiatePayFastPayment);

// Route for handling PayFast callback
router.get('/callback', paymentController.handlePayFastCallback);

module.exports = router;
