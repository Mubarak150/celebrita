const jwt = require('jsonwebtoken');
const util = require('util')
const User = require('../models/User')

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token || req.header('x-auth-token');
    if (!token) {
        return res.redirect('/api/auth/sign-in'); // Redirect to sign-in if no token is found
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/api/auth/sign-in'); // Redirect to sign-in if token is invalid
    }
};

const protect = async (req, res, next) => {
    try {
        // 1. if token exists: 
        const testToken = req.headers.authorization;
        let token; 
        if (testToken && testToken.startsWith('Bearer ')) {
            token = testToken.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ status: false, message: 'No token found' });
        }

        // 2. validate the token: 
        const verifyToken = await util.promisify(jwt.verify)(token, process.env.KEY);
        
        if (!verifyToken) {
            return res.status(401).json({ status: false, message: 'No valid token' });
        }

        // 3. if the user exists: 
        const user = await User.findByPk(verifyToken.id);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User with given token not found' });
        }

        // 4. if the user changed password after the token was issued: 
        // Example: Check if the user's password was changed after the token was issued
        // if (user.passwordChangedAt && user.passwordChangedAt > verifyToken.iat) {
        //     return res.status(401).json({ status: false, message: 'Token is invalid, password changed' });
        // }

        // 5. allow the user to the page: 
        req.body.user = user; // Attach decoded user data to request
        req.body.user_id = verifyToken.id; 
        next(); // Proceed to next middleware or route handler

    } catch (error) {
        return res.status(401).json({ status: false, message: 'Failed to authenticate token', error: error.message });
    }
};

const checkSignIn = async (req, res, next) => {
    try {
        // Check for token in the Authorization header
        const testToken = req.headers.authorization;
        let token; 
        if (testToken && testToken.startsWith('Bearer ')) {
            token = testToken.split(' ')[1];
        }

        if (token) {
            // Validate the token
            const verifyToken = await util.promisify(jwt.verify)(token, process.env.KEY);

            if (verifyToken) {
                // If token is valid, user is already signed in
                return res.status(403).json({ status: false, message: 'User already signed in' });
            }
        }

        // No token or token is invalid, allow access to sign-in page
        next();
    } catch (error) {
        // Token validation failed or error occurred
        next(); // Proceed to sign-in page even if token validation fails
    }
};

// Middleware to prevent access to sign-in page if already signed in
const isAlreadyAuthenticated = (req, res, next) => {
    const token = req.cookies.token || req.header('x-auth-token');
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/'); // Redirect to home if already signed in
        } catch (err) {
            // Token is invalid, proceed to sign-in page
        }
    }

    next();
};

// Middleware to prevent access to sign-in page if already signed in
const isUserAdmin = (req, res, next) => {
    if (req.body.user.role != '1') {
       return res.status(401).json({status: false, message: 'only admin can access this route'})
    }

    next();
};

// Middleware to prevent access to sign-in page if already signed in
const isSalesMan = (req, res, next) => {
    if (req.body.user.role != '3') {
       return res.status(401).json({status: false, message: 'only sale-persons can access this route'})
    }

    next();
};

// for only allowing receptionist i.e. role = 4: 
const isReceptionist = (req, res, next) => {
    if (req.body.user.role != '4') {
       return res.status(401).json({status: false, message: 'only a receptionist can access this route'})
    }

    next();
};

module.exports = { isAuthenticated, isAlreadyAuthenticated, protect, checkSignIn, isUserAdmin, isSalesMan, isReceptionist };

