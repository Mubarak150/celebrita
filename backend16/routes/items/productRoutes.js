const express = require('express');
const router = express.Router();
const uploadImages = require("../../middleware/uploadImage(s)"); 
const {generateBarcode} = require('../../middleware/generateBarcode'); 
// const {protect, checkSignIn} = require('../middleware/auth');
const {
  createProduct,
  getAllProducts,
  getAllProductsForLandingPage,
  getProductById,
  getAllProductsByCategoryName,
  updateProductById,
  deleteProductById,
  searchProductByName,
} = require('../../controllers/items/productController');

router.post('/', uploadImages, generateBarcode, createProduct);
router.get('/', getAllProducts); 
router.get('/all/active', getAllProductsForLandingPage); 
router.get('/search', searchProductByName); 
router.get('/:product', getProductById);
router.get('/category/:category', getAllProductsByCategoryName);
router.patch('/:id', uploadImages, updateProductById);
router.delete('/:id', deleteProductById);

module.exports = router;