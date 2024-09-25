const express = require('express');
const { getNotifications, markNotificationAsRead, deleteNotification } = require('../controllers/notificationController');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Get notifications for a specific user
router.get('/:status', protect,  getNotifications); // status === 'seen' || "unseen"; 

// Mark a specific notification as read
router.patch('/:id', markNotificationAsRead);

// Delete a specific notification by ID
router.delete('/:id', deleteNotification);

module.exports = router;
