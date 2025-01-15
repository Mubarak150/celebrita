const jwt = require("jsonwebtoken");
const util = require("util");
const User = require("../models/User");
const { makeError, CustomError } = require("../utils/CustomError");

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token || req.header("x-auth-token");
  if (!token) {
    return res.redirect("/api/auth/sign-in"); // Redirect to sign-in if no token is found
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect("/api/auth/sign-in"); // Redirect to sign-in if token is invalid
  }
};

// with header:
const protect = async (req, res, next) => {
  try {
    // 1. if token exists:
    const testToken = req.headers.authorization;
    let token;
    if (testToken && testToken.startsWith("Bearer ")) {
      token = testToken.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ status: false, message: "No token found" });
    }

    // 2. validate the token:
    const verifyToken = await util.promisify(jwt.verify)(
      token,
      process.env.KEY
    );

    if (!verifyToken) {
      return res.status(401).json({ status: false, message: "No valid token" });
    }

    // 3. if the user exists:
    const user = await User.findByPk(verifyToken.id);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User with given token not found" });
    }

    if (user.status != "active") {
      // timestamp: 2024-11-05
      return res
        .status(403)
        .json({ status: false, message: "unauthorized, access denied" });
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
    return res.status(401).json({
      status: false,
      message: "Failed to authenticate token",
      error: error.message,
    });
  }
};

// Middleware to prevent access to sign-in page if already signed in
const isAlreadyAuthenticated = (req, res, next) => {
  const token = req.cookies.token || req.header("x-auth-token");
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/"); // Redirect to home if already signed in
    } catch (err) {
      // Token is invalid, proceed to sign-in page
    }
  }

  next();
};

// Middleware to prevent access to sign-in page if already signed in
const isUserAdmin = (req, res, next) => {
  if (req.body.user.role != "1") {
    return res
      .status(401)
      .json({ status: false, message: "only admin can access this route" });
  }

  next();
};

// Middleware to prevent access to sign-in page if already signed in
const isSalesMan = (req, res, next) => {
  //
  if (req.body.user.role != "3") {
    return res.status(401).json({
      status: false,
      message: "only sale-persons can access this route",
    });
  }

  next();
};

const forAdminOrManager = (req, res, next) => {
  if (req.user.role != "1" && req.user.role != "6") {
    return res
      .status(401)
      .json({ status: false, message: "unauthorized access denied" });
  }

  next();
};

const isUser_6 = (req, res, next) => {
  if (req.body.user.role != "6") {
    return res
      .status(401)
      .json({ status: false, message: "unauthorized: access denied" });
  }
  next();
};

// for only allowing receptionist i.e. role = 4:
const isReceptionist = (req, res, next) => {
  if (req.body.user.role != "4") {
    return res.status(401).json({
      status: false,
      message: "only a receptionist can access this route",
    });
  }

  next();
};

// for only allowing receptionist i.e. role = 4:
const isDoctor = (req, res, next) => {
  if (req.body.user.role != "5") {
    return res.status(401).json({
      status: false,
      message: "only the doctor can access this route",
    });
  }

  next();
};

/*------------------------------ vII specific ------------------------------*/

const auth = async (req, res, next) => {
  // cookie version..
  try {
    // 1. Get the token from cookies
    const token = req.cookies.token; // cookie is named 'token'

    // console.log('my sent token token: ', token);
    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "user unauthenticated..." });
    }

    // 2. Validate the token
    const verifyToken = await util.promisify(jwt.verify)(
      token,
      process.env.KEY
    );

    if (!verifyToken) {
      return res
        .status(401)
        .json({ status: false, message: "validation failed" });
    }

    // 3. Check if the user exists
    const user = await User.findByPk(verifyToken.id, {
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
    });
    if (!user) {
      return res.status(404).json({ status: false, message: "user unknown" });
    }

    if (user.status != "active") {
      // timestamp: 2024-11-05
      return res
        .status(403)
        .json({ status: false, message: "unauthorized, access denied" });
    }

    // 4. Allow the user to the page
    req.user = user; // Attach decoded user data to request
    req.user_id = verifyToken.id;
    next(); // Proceed to next middleware or route handler
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: "failed to authenticate...",
      error: error.message,
    });
  }
};

const allow = (...role) => {
  return (req, res, next) =>
    !role.includes(req.user.role)
      ? makeError(`unauthorized...`, 403, next)
      : next();
};

// Middleware for validation
// const validate = (schema) => (req, res, next) => {
//     const { error, value } = schema.validate(req.body);
//     if (error) return makeError(error.details[0].message, 400, next);

//     req.body = value; // Replace the original body with the sanitized version
//     next();
// };

const validate = (schema) => (req, res, next) => {
  try {
    console.log("hello:", req.body);
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  auth,
  allow,
  validate, // vII will use only these 3.
  protect,
  forAdminOrManager,
  isAuthenticated,
  isAlreadyAuthenticated,
  protect,
  isUserAdmin,
  isSalesMan,
  isUser_6,
  isReceptionist,
  isDoctor,
};
