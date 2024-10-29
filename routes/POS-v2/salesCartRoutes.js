const express = require('express');
const { addToSalesCart, fetchSalesCart, deleteItemFromSalesCart, checkoutSaleFromCart } = require('../../controllers/POS-v2/salesCart');
const {protect, isSalesMan} = require('../../middleware/auth')
const router = express.Router();
 

// POST: 
router.post('/', protect, isSalesMan, addToSalesCart);

router.get('/', protect, isSalesMan, fetchSalesCart);
router.delete('/:item_id', protect, isSalesMan, deleteItemFromSalesCart);
router.post('/checkout', protect, isSalesMan, checkoutSaleFromCart);



module.exports = router;