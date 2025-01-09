const express = require("express");
const router = express.Router();
const {
  placeOrder,
} = require("../../controllers/cartAndOrder/createOrderController");
const { placeOrderSchema } = require("../../utils/validators");
const { auth, validate } = require("../../middleware/auth");

// order Routes
router.post("/", auth, validate(placeOrderSchema), placeOrder);

module.exports = router;
