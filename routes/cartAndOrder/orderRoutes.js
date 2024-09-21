const express = require('express');
const router = express.Router();
const { getOrdersByStatus, updateOrderStatus, getOrderById } = require('../../controllers/cartAndOrder/orderController');
const {protect, isUserAdmin} = require('../../middleware/auth')

// Pending Orders
router.get('/pending',  protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'pending')); // done
router.put('/pending/:id/:status',  protect, isUserAdmin, updateOrderStatus); // status = approve || status = reject // done

// Approved Orders
router.get('/approved', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'approved')); // done
router.put('/approved/:id/:status',  protect, isUserAdmin, updateOrderStatus); // status = on-the-way // done

router.get('/rejected', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'rejected')); // done

// On the Way Orders
router.get('/on-the-way',  protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'on-the-way')); // done
router.put('/on-the-way/:id/:status', protect, isUserAdmin, updateOrderStatus); // status: recieve

// Received Orders
router.get('/received', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'received')); // done


// RETURN ORDERS: pending
router.get('/return-pending', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'return-pending')); // 
router.put('/return-pending/:id/:status',  protect, isUserAdmin, updateOrderStatus); // status = return-approve || status = return-reject
// return-rejected dont have routes... as return once rejected is sent to completed orders categoty/status.

// : approved
router.get('/return-approved', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'return-approved')); // 
router.put('/return-approved/:id/:status',  protect, isUserAdmin, updateOrderStatus); // status = return-receive

// : received
router.get('/return-received', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'return-received')); // 

// Completed Orders
router.get('/completed', protect, isUserAdmin, (req, res) => getOrdersByStatus(req, res, 'completed')); // 

// Get Order by ID
router.get('/:id', protect, isUserAdmin, getOrderById); // done

module.exports = router;
