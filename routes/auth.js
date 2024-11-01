const express = require('express');
const { signIn, register, logout, forgotPassword, verifyOTP, resetPassword, updateMe } = require('../controllers/authController');
const {protect, checkSignIn} = require('../middleware/auth');
const router = express.Router();

// for dev: all are defined in authController... 
router.post('/sign-in', signIn);
router.post('/register',  register);
router.post('/logout',  logout);
router.post('/forgot-password',  forgotPassword);
router.post('/verify-otp',  verifyOTP);
router.post('/reset-password',  resetPassword);
router.patch('/update-profile',protect,  updateMe);
module.exports = router;
