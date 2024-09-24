const  Notification  = require('../models/Notification');

// Fetch all notifications for a specific user
const getNotifications = async (req, res) => {
    const { user_id } = req.body.user_id;
    try {
        const notifications = await Notification.findAll({ where: { user_id } });
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

        notification.isRead = true;
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

module.exports = { getNotifications, markNotificationAsRead, deleteNotification };

