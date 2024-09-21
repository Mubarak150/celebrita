const { Server } = require('socket.io');

const userSockets = {};

const initializeSocket = (server) => {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('registerUser', (userId) => {
      userSockets[userId] = socket.id; // Store the user's socket ID
      socket.join(`user_${userId}`); // Join a room specific to the user
      console.log(`User registered: ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
      // Optionally handle disconnection logic here
    });
  });

  return io; // Return the io instance for further use if needed
};

module.exports = { initializeSocket };
