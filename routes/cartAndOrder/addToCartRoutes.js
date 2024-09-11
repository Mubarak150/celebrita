const express = require('express');
const router = express.Router();
const { addToCart } = require('../../controllers/cartAndOrder/addToCartController');
const {protect} = require('../../middleware/auth')

// Cart Routes
router.post('/', protect, addToCart);

module.exports = router;
