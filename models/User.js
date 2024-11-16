const crypto = require('crypto');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
// const Warehouse = require('./Warehouse'); // Import the Warehouse model

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: { // role not to be taken from front end... but manually insert it for admins or may come out with some other solution in admin panel. 
        type: DataTypes.ENUM('1', '2', '3', '4','5', '6'),
        allowNull: false,
        defaultValue: '2'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false, 
        defaultValue: 'active'
    },
    send_emails: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    otp: {
        type: DataTypes.INTEGER, 
        allowNull: true
    }, 
    otp_expiry: {
        type: DataTypes.TIME, 
        allowNull: true
    },
    pass_hash: {
        type: DataTypes.STRING,
        allowNull: false
    }
    
}, {
    tableName: 'users',
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// ::::::::::::::::::::ALERT::::::::::::::::::: 
// use it one time only when you wannna populate the pass_hash of current users.

// (async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('Database connected successfully.');

//         const users = await User.findAll();

//         for (const user of users) {
//             const randomHash = crypto.randomBytes(16).toString('hex');
//             await User.update(
//                 { pass_hash: randomHash },
//                 { where: { id: user.id } }
//             );
//             console.log(`Updated user ID ${user.id} with hash ${randomHash}`);
//         }

//         console.log('All users updated successfully.');
//         await sequelize.close();
//     } catch (error) {
//         console.error('Error updating users:', error);
//     }
// })();



module.exports = User;

