const express = require('express');
const router = express.Router();
const { checkout } = require('../../controllers/cartAndOrder/createOrderController');
const {protect} = require('../../middleware/auth')

// order Routes
router.post('/', protect, checkout);

module.exports = router;
