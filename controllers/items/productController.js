const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Settings = require("../../models/Settings");
const {
  handleCreate,
  handleReadAll,
  handleReadById,
  handleUpdateById,
  handleDeleteById,
} = require("../../utils/functions");
const { Op } = require("sequelize");
const { CustomError, makeError } = require("../../utils/CustomError");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const {
  sendSuccess,
  getAll,
  getOne,
  update,
  create,
} = require("../../utils/helpers");

/*
 _____________________________________________________________________________________
|                                                                                     |
|                           ******* I. CREATE *******                                 |
|_____________________________________________________________________________________|

*/
const createProduct = create(Product);

// handleCreate(`
//     INSERT INTO products (name, description, company_name, manufacturing_date, expiry_date, wholesale_price, price, discount, quantity, thumbnail, status, images, category_id, barcode, supplier)
//     VALUES (:name, :description, :company_name, :manufacturing_date, :expiry_date, :wholesale_price, :price, :discount, :quantity, :thumbnail, :status, :images, :category_id, :barcode, :supplier);
// `);

/*
 _____________________________________________________________________________________
|                                                                                     |
|                          ******* II. READ one *******                               |
|_____________________________________________________________________________________|

*/

// 2.
const getProductById = asyncErrorHandler(
  async (req, res) =>
    await getOne(req, res, Product, [
      { model: Category, attributes: ["id", "category"] },
    ])
);

/*
 _____________________________________________________________________________________
|                                                                                     |
|                          ******* IIi. READ ALL *******                              |
|_____________________________________________________________________________________|

*/

// 3.
const getAllProducts = asyncErrorHandler(
  async (req, res) =>
    await getAll(req, res, Product, [
      { model: Category, attributes: ["id", "category"] },
    ])
);

/*
 _____________________________________________________________________________________
|                                                                                     |
|                           ******* IV. UPDATE *******                                |
|_____________________________________________________________________________________|

*/

// 4.
const updateProductById = update(Product);

exports.updateProductById = handleUpdateById("products");

/*       
         *********  N O T E *********
         I have used this route in the reports .. so will not touch it yet. 
         *********  ******* *********
*/
const getProductsWithValuation = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { status: "active" },
      attributes: ["id", "name", "quantity", "wholesale_price"],
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No active products available for sale.",
      });
    }

    // Initialize total valuation
    let totalValuation = 0;

    // Process products to add `discountedPrice` and `totalPrice`
    let updated_products = products.map((product) => {
      // Convert each product to a plain object
      let productData = product.get({ plain: true });

      // Calculate total price (discounted price * quantity)
      productData.totalPrice =
        productData.wholesale_price * productData.quantity;

      // Accumulate total valuation
      totalValuation += productData.totalPrice;

      return productData;
    });

    res.status(200).json({
      success: true,
      message: "Fetching operation successful",
      products: updated_products,
      totalValuation: totalValuation.toFixed(2), // Round to 2 decimal places
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// ////////////////////////////////////////////////////////

module.exports = {
  createProduct,
  getProductById,
  getAllProducts,
  updateProductById,
  getProductsWithValuation,
};
