const express = require("express");
const router = express.Router();
const {
  placeOrder,
} = require("../../controllers/cartAndOrder/createOrderController");
const { auth } = require("../../middleware/auth");

// order Routes
router.post("/", auth, placeOrder);

module.exports = router;
