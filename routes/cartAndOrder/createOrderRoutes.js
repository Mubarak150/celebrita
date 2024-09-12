const express = require('express');
const router = express.Router();
const { placeOrder } = require('../../controllers/cartAndOrder/createOrderController');
const {protect} = require('../../middleware/auth')

// order Routes
router.post('/', protect, placeOrder);

module.exports = router;
