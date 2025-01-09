const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  deleteCartItem,
  checkout,
} = require("../../controllers/cartAndOrder/addToCartController");
const { auth, validate } = require("../../middleware/auth");
const { cartCheckoutSchema } = require("../../utils/validators");

// Cart Routes
router.post("/", auth, addToCart);
router.get("/", auth, getCart);
router.delete("/:id", auth, deleteCartItem);
router.post("/checkout", auth, validate(cartCheckoutSchema), checkout); //                                                                              prima facie it is a post req... but its execution involves deleting and updating existing rows in db.

module.exports = router;
