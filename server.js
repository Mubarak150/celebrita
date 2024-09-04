const app = require('./app'); 
const { connectDB, sequelize } = require('./config/db'); 



console.log(`The App is in ${app.get('env')}`) // this snippet gives us the environment in which the code is running.. i.e. dev, production, etc. 


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

    const PORT = process.env.PORT;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
