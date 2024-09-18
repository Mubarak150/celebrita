const express = require('express');
const router = express.Router();
const { getOrdersByUser, returnReceivedOrder } = require('../../controllers/cartAndOrder/orderUserController');
const { getOrderById } = require('../../controllers/cartAndOrder/orderController');
const {protect} = require('../../middleware/auth')
const uploadImages = require("../../middleware/uploadImage(s)")

// Pending Orders
router.get('/', protect, getOrdersByUser); // get all orders for user
router.get('/:id', protect, getOrderById); // get one order by id. 
router.patch('/:id', uploadImages, protect, returnReceivedOrder); // update to return one order by id:::


module.exports = router;