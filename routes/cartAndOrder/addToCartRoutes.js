const express = require('express');
const router = express.Router();
const { addToCart, getCart, deleteCartItem, checkout } = require('../../controllers/cartAndOrder/addToCartController');
const {protect} = require('../../middleware/auth')

// Cart Routes
router.post('/', protect, addToCart);
router.get('/', protect, getCart );
router.delete('/:id', protect, deleteCartItem );
router.post('/checkout', protect, checkout); // prima facie it is a post req... but its execution involves deleting and updating existing rows in db. 

module.exports = router;
