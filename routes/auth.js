const express = require('express');
const { signIn, register, logout } = require('../controllers/authController');
const {protect, checkSignIn} = require('../middleware/auth');
const router = express.Router();

// for dev: all the three are defined in authController... 
router.post('/sign-in', signIn);
router.post('/register',  register);
router.post('/logout',  logout); // log out

module.exports = router;
