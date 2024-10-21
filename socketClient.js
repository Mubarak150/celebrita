const io = require('socket.io-client');

// Replace with your actual server URL (IP address or localhost)
const socket = io('http://localhost:3002', {
    transports: ['websocket'], // Force the WebSocket transport for testing
});


// // Listen for connection event
// socket.on('connect', (socket) => {
//     console.log("Connected to Socket.IO server with ID:", socket.id);

    
      
// });

// setTimeout(() => {
//     const userId = 5;  
//     console.log(`Emitting register event with userId: ${userId}`);
//     socket.emit('register', userId);
// }, [2000])


    const userId = 5;  
    console.log(`Emitting register event with userId: ${userId}`);
    io.emit('register', userId);


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
