const express = require('express');
const { signIn, register, logout, forgotPassword, verifyOTP, resetPassword, updateMe, getUsersbyRole, updateStatusByAdmin, updateSalesmanStatusByManager} = require('../controllers/authController');
const {protect, isUserAdmin, isUser_6, forAdminOrManager,} = require('../middleware/auth');
const router = express.Router();

// for dev: all are defined in authController... 
router.post('/sign-in', signIn);
router.post("/logout", protect, logout) // user must be logged in in order to logout. so protect is here.  
router.post('/register',  register);
router.post('/forgot-password',  forgotPassword);
router.post('/verify-otp',  verifyOTP);

// user routes.. should have a separate controller and ancilliaries thereto. 
router.post('/reset-password',  resetPassword);
router.patch('/update-profile', protect,  updateMe);
router.get('/users', protect, forAdminOrManager, getUsersbyRole);

// admin side routes. 
// activation/deactivation of all by admin: 
router.patch('/update-by-admin/:id', protect, forAdminOrManager, updateStatusByAdmin);

// activation/deactivation of salesman by salesmanager: 
// router.patch('/update-by-sales-manager/:id', protect, isUser_6, updateSalesmanStatusByManager);

module.exports = router;
