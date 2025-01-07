const express = require("express");
const {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotificationsForUser,
} = require("../controllers/notificationController");
const router = express.Router();
const { auth } = require("../middleware/auth");

// Get notifications for a specific user based on where they are seen or not [status]
router.get("/:status", auth, getNotifications); // status === 'seen' || "unseen";

// Mark a specific notification as read
router.patch("/:id", auth, markNotificationAsRead);

// Delete
router.delete("/:id", auth, deleteNotification);
router.delete("/", auth, deleteAllNotificationsForUser);

module.exports = router;
