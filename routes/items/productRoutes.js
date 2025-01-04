const express = require("express");
const router = express.Router();
const uploadImages = require("../../middleware/uploadImage(s)");
const {
  generateBarcode,
  processImages,
} = require("../../middleware/generateBarcode");
// const {protect, forAdminOrManager} = require('../../middleware/auth');
const { protect, validate, allow } = require("../../middleware/auth");
const {
  createProductSchema,
  updateProductSchema,
} = require("../../utils/validators");
const {
  createProduct,
  getProductById,
  getAllProducts,
  updateProductById,
  getProductsWithValuation,
} = require("../../controllers/items/productController");

router.post(
  "/",
  uploadImages, // Multer middleware first
  validate(createProductSchema), // Zod validation after multer processes files and body
  processImages,
  generateBarcode,
  createProduct
);

router.get("/:id", getProductById);
router.get("/", getAllProducts);
router.patch(
  "/:id",
  uploadImages,
  validate(updateProductSchema),
  processImages,
  updateProductById
);
// router.get('/all/active', getAllProductsForLandingPage);
// router.get("/all/low-stock",  protect, forAdminOrManager, getLowStockProducts);
router.get(
  "/all/valuation",
  protect,
  allow("1", "6"),
  getProductsWithValuation
); // admin manager
// router.get('/search', searchProductByName);

// router.get('/category/:category', getAllProductsByCategoryName); /// ? category=:category......

// router.delete('/:id', deleteProductById);

module.exports = router;
