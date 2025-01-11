const express = require("express");
const router = express.Router();
const {
  //  getReturnOrdersByUser, getNonReturnOrdersByUser,
  getOrdersofUser,
  returnReceivedOrder,
  returnOnTheWayOrder,
} = require("../../controllers/cartAndOrder/orderUserController");
// const {
//   getOrderById,
// } = require("../../controllers/cartAndOrder/orderController");
const { auth } = require("../../middleware/auth");
const uploadImages = require("../../middleware/uploadImage(s)");

// // Orders
router.get("/", auth, getOrdersofUser); // get all orders for user other than return
// router.get('/in-return', auth, getReturnOrdersByUser); // get all orders for user which are in return
// router.get("/:id", auth, getOrderById); // get one order by id.

// old routes.. not changed in this update v02.
router.patch("/:id/apply-for-return", uploadImages, auth, returnReceivedOrder); // update to return one order by id:::
router.patch("/:id/dispatch-return", auth, returnOnTheWayOrder); // update to return-on-the-way, one order, by id

module.exports = router;
