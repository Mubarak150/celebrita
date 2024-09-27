const  Notification  = require('../models/Notification');

// Fetch all notifications for a specific user
const getNotifications = async (req, res) => {
    const user_id  = req.body.user_id;
    const { status } = req.params; 
    let bool = 0; 
    if(status == 'unseen') {
        bool = 0; 
    } else {
        bool = 1; 
    }
    try {
        const notifications = await Notification.findAll({ where: { user_id, is_seen: bool } });
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
};

// Mark notifications as read
const markNotificationAsRead = async (req, res) => {
    const { id } = req.params; //  notification id; 
    try {
        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.is_seen = true;
        await notification.save();

        res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating notification' });
    }
};

// Delete a specific notification
const deleteNotification = async (req, res) => {
    const { id } = req.params; // notification-id
    try {
        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.destroy();

        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting notification' });
    }
};

// Delete all notifications for a specific user
const deleteAllNotificationsForUser = async (req, res) => {
    const user_id = req.body.user_id; // user-id given by protect middleware

    try {
        // Find all notifications for the specific user
        const notifications = await Notification.findAll({
            where: { user_id }
        });

        if (notifications.length === 0) {
            return res.status(404).json({ success: false, message: 'No notifications found for this user' });
        }

        // Delete all notifications for the user
        await Notification.destroy({
            where: { user_id, is_seen: 1 }
        });

        res.status(200).json({ success: true, message: 'All notifications deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting notifications' });
    }
};


module.exports = { getNotifications, markNotificationAsRead, deleteNotification, deleteAllNotificationsForUser };

