const express = require('express');
const router = express.Router();
const uploadImages = require("../../middleware/uploadImage(s)"); 
const {generateBarcode} = require('../../middleware/generateBarcode'); 
const {protect, forAdminOrManager} = require('../../middleware/auth');
const {
  createProduct,
  getAllProducts,
  getAllProductsForLandingPage,
  getProductById,
  getAllProductsByCategoryName,
  updateProductById,
  deleteProductById,
  searchProductByName,
  getLowStockProducts,
  getProductsWithValuation
} = require('../../controllers/items/productController');

router.post('/', uploadImages, generateBarcode, createProduct);

router.get('/', getAllProducts); 
router.get('/all/active', getAllProductsForLandingPage); 
router.get("/all/low-stock",  protect, forAdminOrManager, getLowStockProducts); 
router.get("/all/valuation",  protect, forAdminOrManager, getProductsWithValuation);
router.get('/search', searchProductByName); 
router.get('/:product', getProductById);
router.get('/category/:category', getAllProductsByCategoryName);

router.patch('/:id', uploadImages, updateProductById);

router.delete('/:id', deleteProductById);


module.exports = router;