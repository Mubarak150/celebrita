const express = require('express');
const router = express.Router();
const { getOrdersByStatus, updateOrderStatus, getOrderById } = require('../../controllers/cartAndOrder/orderController');
const {protect, isUserAdmin} = require('../../middleware/auth')

// Pending Orders
router.get('/pending',  protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'pending')); // done
router.put('/pending/:id/:status',  protect, isUserAdmin, updateOrderStatus); // status = approve || status = reject // done
// router.put('/pending/:id/reject',  protect, isUserAdmin, updateOrderStatus); // 


// Approved Orders
router.get('/approved', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'approved')); // done
router.put('/approved/:id/:status',  protect, isUserAdmin, updateOrderStatus); // status = on-the-way // done

router.get('/rejected', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'rejected')); // done

// On the Way Orders
router.get('/on-the-way',  protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'on-the-way')); // done
router.put('/on-the-way/:id/:status', protect, isUserAdmin, updateOrderStatus); // status: recieve

// Received Orders
router.get('/received', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'received')); // done


// return and complete yet to be done.... 
// Return Orders
router.get('/return', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'return')); // 

// Completed Orders
router.get('/complete', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'complete')); // 

// Get Order by ID
router.get('/:id', protect, isUserAdmin, getOrderById); // done

module.exports = router;
