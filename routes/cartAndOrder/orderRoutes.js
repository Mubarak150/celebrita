const express = require('express');
const router = express.Router();
const { getOrdersByStatus, updateOrderStatus, getOrderById } = require('../../controllers/cartAndOrder/orderController');

// Pending Orders
router.get('/pending', (req, res) => getOrdersByStatus(req, res, 'pending'));
router.put('/pending/:id/approve', updateOrderStatus);
router.put('/pending/:id/reject', updateOrderStatus);
const {protect, isUserAdmin} = require('../../middleware/auth')

// Approved Orders
router.get('/approved', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'approved'));
router.put('/approved/:id/assign-courier',  protect, isUserAdmin, updateOrderStatus);

// On the Way Orders
router.get('/on-the-way',  protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'on the way'));
router.put('/on-the-way/:id/receive', protect, isUserAdmin, updateOrderStatus);

// Received Orders
router.get('/received', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'received'));

// Return Orders
router.get('/return', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'return'));

// Completed Orders
router.get('/complete', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'complete'));

// Get Order by ID
router.get('/:id', protect, isUserAdmin, getOrderById);

module.exports = router;
