const express = require('express');
const router = express.Router();
const { addToCart, checkout } = require('../../controllers/cartAndOrder/createOrderController');

// order Routes
router.post('/', checkout);

module.exports = router;
