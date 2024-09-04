const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const User = require('../models/User');
// const Warehouse = require('../models/Warehouse');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// const { createOne, hashPassword } = require('../utils/functions');

// Rate limiter to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 requests per windowMs
    message: 'Too many login attempts, please try again later',
});

// Helper function to generate tokens
const signToken = (id, user) => {
    return jwt.sign(
        {
            id,
            username: user.name,
            usermail: user.email
        },
        process.env.KEY,
        {
            expiresIn: 3600 // 1 hour
        }
    );
};

// Helper function to validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.error('Missing email or password');
            return res.status(400).json({ message: "All fields required" });
        }
    
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.error('User not found');
            return res.status(404).json({ message: "User not found" });
        }
       
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.error('Incorrect password');
            return res.status(401).json({ message: "Incorrect password" });
        }

        if (!user.isActive) {
            console.error('Access denied');
            return res.status(403).json({ message: "Access denied" });
        }
        
        const token = signToken(user.id, user);

        return res.status(200).json({
            status: true,
            token,
            user: {
                id: user.id,
                username: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error during sign in:', error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.register = async (req, res) => {
    const { name, email, password, role = '2'} = req.body;

    // Validate required fields
    if (!name || !email || !password ) {
        return res.status(400).json({ msg: 'Fill all the fields.' });
    }

    // Validate email format
    if (!validateEmail(email)) {
        return res.status(400).json({ msg: 'Invalid email format.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ msg: 'User already exists with this email' });
    }

    // // Check if passwords match
    // if (password !== confirmPassword) {
    //     return res.status(400).json({ msg: 'Passwords do not match.' });
    // }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Logging out a user
exports.logout = (req, res) => {
    res.clearCookie('token'); // Removing the JWT token from cookies
    res.status(200).json({ message: 'Successfully logged out' });
};

