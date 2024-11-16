const crypto = require('crypto'); // for random number generation
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const PasswordChangeLog = require('../models/PasswordChangeLog');
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

const sendCookie = (res, token) => {
  const cookieExpirationTime = 1000*60*60*24*7; // 7 days
  const expirationDate = new Date(Date.now() + cookieExpirationTime);

  let options = {
      expires: expirationDate, // Set expiration date
      httpOnly: true, // Helps mitigate XSS attacks
      sameSite: 'None',  
      // secure: true
  };
  return res.cookie('token', token, options); 
}

// Helper function to validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

exports.signIn = async (req, res) => {
    try {
        const { email, password, pass_hash } = req.body;
        let user; 

        // logging in with the card
        if(pass_hash) {
            user = await User.findOne({ where: { pass_hash } });
            if (!user) {
                return res.status(404).json({ status: false, message: "User not found" });
            }
    
            if (user.status != 'active') { // timestamp: 2024-11-05
                return res.status(403).json({ status: false, message: 'unauthorized, access denied' });
            }
        } else {

          // logging with the primitive approach.
            if (!email || !password) {
                console.error('Missing email or password');
                return res.status(400).json({ message: "All fields required" });
            }
        
            user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ status: false, message: "User not found" });
            }

            if (user.status != 'active') { // timestamp: 2024-11-05
                return res.status(403).json({ status: false, message: 'unauthorized, access denied' });
            }
          
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: "Incorrect password" });
            }
        
        }

        
        const token = signToken(user.id, user);
        sendCookie(res, token); 
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
  const { name, email, password, role = '2' } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
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

  try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a secure random hash of length 32
      const passHash = crypto.randomBytes(16).toString('hex'); // 16 bytes = 32 hex characters

      // Create the user
      const newUser = await User.create({
          name,
          email,
          password: hashedPassword,
          role,
          pass_hash: passHash // Save the generated hash to the pass_hash column
      });

      res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logging out a user
exports.logout = (req, res) => {
  return res
    .clearCookie("token")
    .status(200)
    .json({ status: true,  message: "Successfully logged out 😏 🍀" });
    // res.clearCookie('token'); // Removing the JWT token from cookies
    // res.status(200).json({status: true,  message: 'Successfully logged out' });
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

// update me: 
exports.updateMe = async (req, res, next) => {
  try {
      const { password, change_password, new_password, confirm_password } = req.body;

      if (!password) {
          return res.status(400).json({ success: false, message: 'Current password is required for updates' });
      }

      const user = await User.findOne({ where: { id: req.body.user.id } });
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
          return res.status(401).json({ success: false, message: 'Incorrect password' });
      }

      const updateData = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.email) updateData.email = req.body.email;

      if (change_password) {
          if (!new_password || !confirm_password) {
              return res.status(400).json({ success: false, message: 'New password and confirm password are required' });
          }
          if (new_password !== confirm_password) {
              return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
          }
          updateData.password = await bcrypt.hash(new_password, 10);
      }

      const rowsUpdated = await User.update(updateData, {
          where: { id: req.body.user.id },
          validate: true
      });

      if (rowsUpdated[0] > 0) {
          return res.status(200).json({ success: true, message: 'User updated successfully' });
      } else {
          return res.status(400).json({ success: false, message: 'User update failed' });
      }
  } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// users get: 
exports.getUsersbyRole = async( req, res) => {
  let { role } = req.query;

  let roleValue;
  switch (role) {
      case "admin":
          roleValue = '1';
          break;
      case "user":
          roleValue = '2';
          break;
      case "salesman":
          roleValue = '3';
          break;
      case "receptionist":
          roleValue = '4';
          break;
      case "doctor":
          roleValue = '5';
          break;
      default:
          return null; 
  }
  
  role = roleValue;  
  
  
  if (!role ) {
    return res.status(400).json({status: false,  message: "role required" });
  }

  try {
    const users = await User.findAll({ where: { role } });
    if (!users) {
      return res.status(404).json({status: true,  message: "Users not found with this role" });
    }

    let roles = ['admin', 'user', 'salesman', 'receptionist', 'doctor', 'sales-manager']; 

    let updatedUsers = users.map(user => {
      // Convert Sequelize instance to a plain object
      let userObj = user.get({ plain: true });
      userObj = {
        id: userObj.id, 
        name: userObj.name,
        email: userObj.email,
        status: userObj.status,
        role: userObj.role,
        _qr: userObj.pass_hash
      }

      // :::::::: je maaro code chay :::::: assiging role for frontend purposes from the array above.
      userObj.role = roles[Number(userObj.role) - 1]; 
      
      return userObj;
  });

    res.status(200).json({status: true,  users: updatedUsers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({status: false,  message: "Internal server error" });
  }
}

exports.updateStatusByAdmin = async (req, res) => {
  try {
      const { id } = req.params;

      if (!id ) {
          return res.status(400).json({ message: "Missing id" });
      }
  
      const user = await User.findOne({ where: { id } });
      if (!user) {
          console.error('User not found');
          return res.status(404).json({ message: "User not found" });
      }
     
      user.status = user.status == 'active' ? 'inactive' : 'active'; 
      await user.save()
      return res.status(200).json({
          status: true,
          message: 'status updated successfully'
      });
  } catch (error) {
      console.error('Error during sign in:', error);
      return res.status(500).json({ message: "Server error" });
  }
};

exports.updateSalesmanStatusByManager = async (req, res) => {
  try {
      const { id } = req.params;

      if (!id ) {
          return res.status(400).json({ message: "Missing id" });
      }
  
      const user = await User.findOne({ where: { id } });
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      if(user.role != '3') {
        return res.status(404).json({ message: "unauthorized to make such modifications" });
    }
     
      user.status = user.status == 'active' ? 'inactive' : 'active'; 
      await user.save()
      return res.status(200).json({
          status: true,
          message: 'status updated successfully'
      });
  } catch (error) {
      console.error('Error during sign in:', error);
      return res.status(500).json({ message: "Server error" });
  }
};

// change password of others... 
exports.changePassword = async (req, res) => {
  const { user } = req.body;
  const { userId, newPassword } = req.body; 

  try {
    // Fetch the target user by ID
    const targetUser = await User.findByPk(userId);

    // Check if the target user exists
    if (!targetUser) {
      return res.status(404).json({ status: false, message: "Action failed" });
    }

    // Admin (role 1) can change passwords of all roles except other admins
    if (user.role == '1') {
      if (targetUser.role == '1') {
        return res.status(403).json({ status: false, message: "Action failed" });
      }
    }
    // Sales Manager (role 6) can change only Salesmen's (role 3) passwords
    else if (user.role == '6') {
      if (targetUser.role != '3') {
        return res.status(403).json({ status: false, message: "Action failed" });
      }
    }
    // If role is neither Admin nor Sales Manager (shouldn’t reach this due to `forAdminOrManager`)
    else {
      return res.status(403).json({ status: false, message: "Unauthorized request" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    targetUser.password = hashedPassword;

    // Save updated password to database
    await targetUser.save();

    // Log the password change
    await PasswordChangeLog.create({
      changed_by: user.id, // ID of the admin or manager making the change
      changed_by_name: user.name, // Name of the person changing the password
      changed_user_id: targetUser.id, // ID of the user whose password is changed
      changed_user_name: targetUser.name, // Name of the user whose password is changed
      change_time: new Date(), // Current time
  });

    res.status(200).json({ status: true, message: "Action succeeded" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ status: false, message: "Action failed" });
  }
};






