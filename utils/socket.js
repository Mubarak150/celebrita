const { Server } = require('socket.io');
const Notification = require('../models/Notification'); // Import your notification model
const User = require('../models/User'); // Import your User model

let io; // Define a global variable for io instance

// Store user ID to socket ID mapping
const userSocketMap = new Map(); // This will map userId -> socketId

// Initialize Socket.io
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.ORIGIN, // Allow CORS from your frontend origin
            credentials: true,
        },
    });

    console.log('Socket.io initialized!');

    // Listen for socket connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Handle user registration (admins and users both come from users table)
        socket.on('register', async (userId) => {
            try {
                // Fetch the user from the database to check their role
                const user = await User.findOne({ where: { id: userId } });
                if (!user) {
                    console.log(`User with ID ${userId} not found.`);
                    return;
                }

                // Store the userId -> socketId mapping
                userSocketMap.set(userId, socket.id);
                console.log(`User registered with ID: ${userId}, Role: ${user.role}`);

                // If the user is an admin (role 1), add them to the 'admins' room
                if (user.role === 1) {
                    socket.join('admins');
                    console.log(`Admin ${userId} joined the 'admins' room`);
                }

            } catch (error) {
                console.error(`Error fetching user with ID ${userId}:`, error);
            }
        });

        // Handle order notifications for specific users
        socket.on('send-notification', async ({ userId, orderId, notification }) => {
            const socketId = userSocketMap.get(userId);
            if (socketId) {
                // Emit notification to the specific user
                io.to(socketId).emit('receive-notification', notification);
                console.log(`Notification sent to user: ${userId}`);
            } else {
                console.log(`User ${userId} is not connected, saving notification...`);
            }

            // Save the notification to the database (for offline notifications)
            await Notification.create({
                user_id: userId,
                order_id: orderId,
                content: notification,
                isRead: false,
            });
        });

        // Handle admin-specific actions and notify all admins
        socket.on('admin-action', async ({ notification }) => {
            // Broadcast the notification to all admins in the 'admins' room
            io.to('admins').emit('admin-notification', notification);
            console.log('Admin action notification sent to all admins');

            // Store notification for all admins in the database
            const admins = await User.findAll({ where: { role: 1 } });
            admins.forEach(async (admin) => {
                await Notification.create({
                    userId: admin._id,
                    content: notification,
                    isRead: false,
                });
            });
        });

        // Handle disconnections
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // Remove the userId from the map when they disconnect
            userSocketMap.forEach((value, key) => {
                if (value === socket.id) {
                    userSocketMap.delete(key);
                    console.log(`User with ID ${key} disconnected`);
                }
            });
        });
    });
};

// Function to send a notification to a specific user
const sendNotificationToUser = async (userId, orderId, message) => {
    const socketId = userSocketMap.get(userId); // Get the socket ID for this user
    if (socketId) {
        io.to(socketId).emit('Order Notification', message); // Send notification to the user's socket
        console.log(`Notification sent to user ${userId}`);
    } else {
        console.log(`User ${userId} not connected`);
    }

    // Save the notification to the database for offline users
    await Notification.create({
        user_id: userId,
        order_id: orderId,
        message,
        isRead: false,
    });
};

// Function to notify all admins
const notifyAllAdmins = async (orderId, message) => {
    io.to('admins').emit('Admin Notification', message); // Broadcast to all admins in the 'admins' room
    console.log('Notification sent to all admins');

    // Save the notification to the database for each admin
    // Find all admins (assuming role '1' is admin)
    const admins = await User.findAll({
        where: {
            role: 1
        }
    });

    // Loop through each admin and create a notification
    for (const admin of admins) {
        await Notification.create({
            user_id: admin.id, // Sequelize uses 'id' instead of '_id' in most cases
            order_id: orderId,
            message,
            isRead: false,
        });
    }
};

// Export initializeSocket and other socket functions
module.exports = { initializeSocket, sendNotificationToUser, notifyAllAdmins };
