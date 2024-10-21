const io = require('socket.io-client');

// Replace with your actual server URL (IP address or localhost)
const socket = io('http://localhost:3002', {
    transports: ['websocket'], // Force the WebSocket transport for testing
});

// Once connected, emit the register event with userId (replace with actual userId)
socket.on('connect', () => {
    console.log("Connected to Socket.IO server");

    // Emit the 'register' event with userId
    const userId = 4;  // Replace with actual userId for testing (e.g., receptionist or doctor)
    socket.emit('register', userId);  // Emitting the 'register' event
    console.log(`Register event emitted with userId: ${userId}`);
});

// Listen for notifications
socket.on('doctor-notification', (message) => {
    console.log(`Received doctor notification: ${message}`);
});

socket.on('receptionist-notification', (message) => {
    console.log(`Received receptionist notification: ${message}`);
});

// Just keep the socket open to keep listening for notifications
socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
});
