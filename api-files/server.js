const app = require('./app'); 
const { connectDB, sequelize } = require('./config/db');
const http = require('http'); // Import http module to create the server
const { initializeSocket } = require('./utils/socket'); // Import socket initialization from utils

console.log(`The App is running in ${app.get('env')} environment`);

// Create an HTTP server and pass the Express app to it
const server = http.createServer(app);

// Start the server with database connection and model sync
const startServer = async () => {
    await connectDB(); // Connect to the database

    // Sync models
    try {
        await sequelize.sync({ force: false });
        console.log('Database & tables created!');
    } catch (error) {
        console.error('Error syncing database:', error.message);
        process.exit(1);
    }

    // Initialize Socket.io
    initializeSocket(server); // Pass the HTTP server to the socket initialization

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
