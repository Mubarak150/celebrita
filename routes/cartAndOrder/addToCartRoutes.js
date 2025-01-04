const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  deleteCartItem,
  checkout,
} = require("../../controllers/cartAndOrder/addToCartController");
const { auth } = require("../../middleware/auth");

// Cart Routes
router.post("/", auth, addToCart);
router.get("/", auth, getCart);
router.delete("/:id", auth, deleteCartItem);
router.post("/checkout", auth, checkout); //                                                                              prima facie it is a post req... but its execution involves deleting and updating existing rows in db.

module.exports = router;
