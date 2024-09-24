const express = require('express');
const router = express.Router();
const { getReturnOrdersByUser, getNonReturnOrdersByUser, returnReceivedOrder, returnOnTheWayOrder } = require('../../controllers/cartAndOrder/orderUserController');
const { getOrderById } = require('../../controllers/cartAndOrder/orderController');
const {protect} = require('../../middleware/auth')
const uploadImages = require("../../middleware/uploadImage(s)")

// Orders
router.get('/in-progress', protect, getNonReturnOrdersByUser); // get all orders for user other than return
router.get('/in-return', protect, getReturnOrdersByUser); // get all orders for user which are in return
router.get('/:id', protect, getOrderById); // get one order by id. 

router.patch('/:id/apply-for-return', uploadImages, protect, returnReceivedOrder); // update to return one order by id:::
router.patch('/:id/dispatch-return', protect, returnOnTheWayOrder); // update to return-on-the-way, one order, by id


module.exports = router;