const crypto = require('crypto'); // for random number generation
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const moment = require('moment'); // for time manipulation
require('dotenv').config();
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
           expiresIn: 5 * 24 * 60 * 60 // 5 days periodd for expiry (set in seconds) 
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
        
        const token = signToken(user.id, user);

        return res.status(200).json({
            status: true,
            token,
            user: {
                id: user.id,
                username: user.name,
                email: user.email,
                role: user.role
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
    res.status(200).json({status: true,  message: 'Successfully logged out' });
};




exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({status: false,  message: "Email is required" });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({status: false,  message: "User not found with this email" });
    }

    // Generate a 5-digit random OTP
    const otp = crypto.randomInt(10000, 99999).toString();

    // Set OTP expiry time (current time + 4 minutes)
    const expiryTime = moment().add(4, 'minutes').toDate();

    user.otp = otp;
    user.otp_expiry = expiryTime; 

    await user.save();

    const mailOptions = {
      from: process.env.NODEMAILER_USER, 
      to: email,
      subject: 'Reset Password OTP',
      text: `Your OTP for password reset is: ${otp}. It will expire in 3 minutes.`
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.NODEMAILER_USER, 
        pass: process.env.NODEMAILER_PASS
      }
    });

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        return res.status(500).json({status: false,  message: 'Error sending OTP' });
      } else {
        console.log('OTP sent successfully:', info.response);
        return res.status(200).json({status: true,  message: 'OTP sent to your email' });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({status: false,  message: 'Internal server error' });
  }
};



exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).json({status: false,  message: "Email and OTP are required" });
    }
  
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({status: false,  message: "User not found with this email" });
      }
  
      const now = moment().utc(); // Convert to UTC
      const Expiry = user.otp_expiry; 

      if (now > Expiry) {
        return res.status(400).json({status: false,  message: "OTP has expired" });
      }
  
      if (user.otp !== otp) {
        return res.status(400).json({status: false,  message: "Invalid OTP" });
      }
  
      // After otp verification, clear OTP and expiry
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
  
      res.status(200).json({status: true,  message: "OTP verified successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({status: false,  message: "Internal server error" });
    }
  };


// reset your password
exports.resetPassword = async (req, res) => {
    
    const {password, confirmPassword, email} = req.body;
    
    if(!confirmPassword || !password || !email) {
        return res.json({status: false, message: "all fields required"})
    }

    if(password !== confirmPassword) {
        return res.json({status: false, message: "passwords must match"})
    }

    try{
        const hashPass = await bcrypt.hash(password, 10);

        await User.update({ password: hashPass }, { where: { email } });
        return res.json({status: true, message: 'password changed successfully'})

    } catch(e){
        return res.json({status: false, message: 'invalid operation!'})
    }
}


