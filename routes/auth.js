const express = require('express');
const { signIn, register, logout, forgotPassword, verifyOTP, resetPassword, updateMe, getUsersbyRole, updateStatusByAdmin} = require('../controllers/authController');
const {protect, isUserAdmin, isUser_6, checkSignIn} = require('../middleware/auth');
const router = express.Router();

// for dev: all are defined in authController... 
router.post('/sign-in', signIn);
router.post("/log-out", protect, logout) // user must be logged in in order to logout. so protect is here.  
router.post('/register',  register);
router.post('/logout',  logout);
router.post('/forgot-password',  forgotPassword);
router.post('/verify-otp',  verifyOTP);

// user routes.. should have a separate controller and ancilliaries thereto. 
router.post('/reset-password',  resetPassword);
router.patch('/update-profile', protect,  updateMe);
router.get('/users', protect, isUserAdmin, getUsersbyRole);

// activation/deactivation of all by admin: 
router.patch('/update-by-admin/:id', updateStatusByAdmin);

// activation/deactivation of salesman by salesmanager: 
// router.patch('/update-by-admin', protect, isUser_6, updateStatusBySalesManager);

module.exports = router;
