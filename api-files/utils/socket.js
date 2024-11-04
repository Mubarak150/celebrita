const { Server } = require('socket.io');
const Notification = require('../models/Notification');
const User = require('../models/User'); 

let io; // Define a global variable for io instance

// Store user ID to socket ID mapping
const userSocketMap = new Map(); // This will map userId -> socketId

// Initialize Socket.io
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.ORIGIN, // Allow CORS: frontend
            credentials: true,
        },
    });

    console.log('Socket.io initialized!');

    // Listen for socket connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Handle user registration (admins, doctors, receptionists, users)
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

                // in this step cross check the data type of your user.role; or else keep == instead of ===
                // Assign user to respective rooms based on their role, role is stored as a string i.e '5' not as int 5.. putting 3 equals instead of 2 took me a whole day of debugging. 
                if      (user.role == 1) socket.join('admins');
                else if (user.role == 4) socket.join('receptionists'); 
                else if (user.role == 5)  socket.join('doctors'); 


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
            } 

            // Save the notification to the database (for offline notifications)
            await Notification.create({
                user_id: userId,
                order_id: orderId,
                content: notification,
                isRead: false,
            });
        });

        // Handle doctor-specific actions and notify receptionists
        socket.on('doctor-action', async ({ notification }) => {
            // Broadcast the notification to all receptionists in the 'receptionists' room
            io.to('receptionists').emit('doctor-notification', notification);

            // Store the notification for all receptionists in the database
            const receptionists = await User.findAll({ where: { role: 4 } });
            receptionists.forEach(async (receptionist) => {
                await Notification.create({
                    user_id: receptionist.id,
                    content: notification,
                    isRead: false,
                });
            });
        });

        // Handle admin-specific actions and notify all admins
        socket.on('admin-action', async ({ notification }) => {
            // Broadcast the notification to all admins in the 'admins' room
            io.to('admins').emit('admin-notification', notification);

            // Store notification for all admins in the database
            const admins = await User.findAll({ where: { role: 1 } });
            admins.forEach(async (admin) => {
                await Notification.create({
                    user_id: admin.id,
                    content: notification,
                    isRead: false,
                });
            });
        });

        // Handle disconnections
        socket.on('disconnect', () => {
            // Remove the userId from the map when they disconnect
            userSocketMap.forEach((value, key) => {
                if (value === socket.id) {
                    userSocketMap.delete(key);
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

    // Save the notification to the database for each admin
    const admins = await User.findAll({
        where: {
            role: 1
        }
    });

    // Loop through each admin and create a notification
    for (const admin of admins) {
        await Notification.create({
            user_id: admin.id, 
            order_id: orderId,
            message,
            isRead: false,
        });
    }
};

// broadcasting to all receptionists that were added to the room. 
const notifyAllReceptionists = async message => io.to('receptionists').emit('receptionist-notification', message);

// Broadcast to all doctors in the 'doctors' room
const notifyAllDoctors = async message => io.to('doctors').emit('doctor-notification', message); 


// Export initializeSocket and other socket functions
module.exports = { 
    initializeSocket, 
    sendNotificationToUser, 
    notifyAllAdmins,
    notifyAllReceptionists,  
    notifyAllDoctors  
};