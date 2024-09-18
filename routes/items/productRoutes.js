const express = require('express');
const router = express.Router();
const uploadImages = require("../../middleware/uploadImage(s)")
// const {protect, checkSignIn} = require('../middleware/auth');
const {
  createProduct,
  getAllProducts,
  getProductById,
  getAllProductsByCategoryName,
  updateProductById,
  deleteProductById,
} = require('../../controllers/items/productController');

router.post('/', uploadImages, createProduct);
router.get('/', getAllProducts); 
router.get('/:product', getProductById);
router.get('/category/:category', getAllProductsByCategoryName);
router.patch('/:id', uploadImages, updateProductById);
router.delete('/:id', deleteProductById);

module.exports = router;