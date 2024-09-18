const express = require('express');
const router = express.Router();
const { getOrdersByUser, updateUserOrderStatus } = require('../../controllers/cartAndOrder/orderUserController');
const {protect, isUserAdmin} = require('../../middleware/auth')

// Pending Orders
router.get('/', protect, getOrdersByUser); // 

module.exports = router;