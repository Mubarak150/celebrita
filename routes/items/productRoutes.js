const express = require('express');
const router = express.Router();
const uploadImages = require("../../middleware/uploadImage(s)")
// const {protect, checkSignIn} = require('../middleware/auth');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
} = require('../../controllers/items/productController');

router.post('/', uploadImages, createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.patch('/:id', uploadImages, updateProductById);
router.delete('/:id', deleteProductById);

module.exports = router;