const express = require("express");
const router = express.Router();
const uploadImages = require("../../middleware/uploadImage(s)");
const {
  generateBarcode,
  processImages,
} = require("../../middleware/generateBarcode");
const { auth, validate, allow } = require("../../middleware/auth");
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
  auth,
  allow("1", "6"),
  uploadImages, //                                                                           for any future dev: i.  keep this Multer middleware first
  validate(createProductSchema), //                                                          ******************  ii. and this Zod validation  will come after multer processes files and body
  processImages,
  generateBarcode,
  createProduct
);

router.get("/:id", getProductById);

/*
                                                                                            this API can be used for: 
                                                                                            1. getLowStockProducts                          // /?quantity[lte]=:quantity(int) use it like /?quantity[lte]=10
                                                                                            2. getAllProductsForLandingPage                 // /?status=active&limit=12
                                                                                            3. getAllProductsByCategory                     // /?category_id=:id(int).... meaning now pass catergory_id instead of category name
                                                                                            4. searchProductByName                          // /?name_like=:name(string)
                                                                                            5. getAllProducts                               // main use. 
                                                                                            6. max price                                    // /?price[lte]=:price(int)

*/
router.get("/", getAllProducts);

router.patch(
  "/:id",
  auth,
  allow("1", "6"),
  uploadImages,
  validate(updateProductSchema),
  processImages,
  updateProductById
);

/*       
                                                                                          *********  N O T E *********
                                                                                          I have used this route in the reports .. so will not touch it yet. 
                                                                                          *********  ******* *********
*/
router.get("/all/valuation", auth, allow("1", "6"), getProductsWithValuation); //          admin manager

/*      
                                                                                           **********************  ****************************
                                                                                                      *********  N O T E *********
                                                                                              these must be deleted at the end of the project 
                                                                                                      *********  ******* *********
                                                                                           **********************  ****************************
*/

// router.get('/all/active', getAllProductsForLandingPage);
// router.get("/all/low-stock",  auth, forAdminOrManager, getLowStockProducts);

// router.get('/search', searchProductByName);

// router.get('/category/:category', getAllProductsByCategoryName); /// ? category=:category......

// router.delete('/:id', deleteProductById);

module.exports = router;

/*
{
    "status": "error",
    "message": "Unexpected token '/', \"/uploads/p\"... is not valid JSON",
    "stackTrace": "SyntaxError: Unexpected token '/', \"/uploads/p\"... is not valid JSON\n    at JSON.parse (<anonymous>)\n    at parsefn (F:\\Mudassir shah\\celebrita\\celebrita\\utils\\helpers.js:43:27)\n    at F:\\Mudassir shah\\celebrita\\celebrita\\utils\\helpers.js:49:56\n    at Array.map (<anonymous>)\n    at parse (F:\\Mudassir shah\\celebrita\\celebrita\\utils\\helpers.js:49:42)\n    at getAll (F:\\Mudassir shah\\celebrita\\celebrita\\utils\\helpers.js:121:21)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async F:\\Mudassir shah\\celebrita\\celebrita\\controllers\\items\\productController.js:64:5",
    "error": {
        "statusCode": 500,
        "status": "error"
    }
}
*/
