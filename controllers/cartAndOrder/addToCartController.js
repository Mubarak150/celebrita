const Cart = require("../../models/Cart");
const CartItem = require("../../models/CartItem");
const Product = require("../../models/Product");
const { Op } = require("sequelize");
const { makeError } = require("../../utils/CustomError");
const { sendSuccess } = require("../../utils/helpers");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");

/*
 _____________________________________________________________________________________
|                                                                                     |
|                         ******* ADD TO CART *******                                 |
|_____________________________________________________________________________________|

*/
const addToCart = asyncErrorHandler(async (req, res, next) => {
  const user_id = req.user_id;
  const { product_id, quantity } = req.body;

  //                                                                                                       Find the user's cart
  let cart = await Cart.findOne({ where: { user_id } });
  if (!cart) {
    cart = await Cart.create({ user_id });
  }

  //                                                                                                       Fetch the product to check available stock
  const product = await Product.findByPk(product_id);
  if (!product) return makeError(`Product not found`, 404, next);

  if (product.quantity <= 0)
    return makeError(`Product out of stock`, 404, next);

  //                                                                                                       Check if the quantity exceeds available stock
  let cartItem = await CartItem.findOne({
    where: { cart_id: cart.id, product_id },
  });

  const currentQuantity = cartItem ? cartItem.quantity : 0;
  const totalQuantity = currentQuantity + quantity;

  if (totalQuantity > product.quantity)
    return makeError(
      `Cannot add to cart. Available stock: ${product.quantity}, which cannot surpass already added quantity`,
      400,
      next
    );

  //                                                                                                       if the product already exists in the cart
  if (cartItem)
    return makeError(
      res,
      200,
      "item already in cart, please visit your cart to alter quantity."
    );
  else {
    //                                                                                                       Add a new cart item
    await CartItem.create({ cart_id: cart.id, product_id, quantity });
  }

  return sendSuccess(res, 201, "Product added to cart");
});

/*
 _____________________________________________________________________________________
|                                                                                     |
|                           ******* GET CART *******                                  |
|_____________________________________________________________________________________|

*/
const getCart = asyncErrorHandler(async (req, res) => {
  const user_id = req.user_id;

  //                                                                                                       Find the user's cart
  const cart = await Cart.findOne({ where: { user_id }, include: CartItem });
  if (!cart || cart.CartItems.length === 0)
    return sendSuccess(res, 200, "your cart is empty yet.");

  //                                                                                                       Fetch product details for each cart item
  const cartDetails = await Promise.all(
    cart.CartItems.map(async (item, index) => {
      const product = await Product.findByPk(item.product_id, {
        attributes: ["name", "price", "discount", "quantity", "thumbnail"],
      });
      return {
        index: index + 1,
        id: item.id,
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        stock: product.quantity,
        price: product.price,
        discount: product.discount,
        thumbnail: product.thumbnail,
      };
    })
  );

  //                                                                                                       Return the cart details
  return sendSuccess(res, 200, "", { results: cartDetails });
});

/*
 _____________________________________________________________________________________
|                                                                                     |
|                      ******* DELETE AN ITEM FROM CART *******                       |
|_____________________________________________________________________________________|

*/

const deleteCartItem = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params; //                                                                             cart_item.ID

  if (!id) return makeError(`item required`, 400, next);

  const deletedItem = await CartItem.destroy({
    where: { id },
  });

  if (deletedItem === 0) return makeError(`item not found`, 404, next);
  return sendSuccess(res, 200, "item deleted successfully");
});

/*
 _____________________________________________________________________________________
|                                                                                     |
|            ******* CHECK OUT THE CART TO DB FROM LOCAL *******                      |
|_____________________________________________________________________________________|

*/
const checkout = asyncErrorHandler(async (req, res, next) => {
  const user_id = req.user_id;
  const { updatedCartItems } = req.body;

  const cart = await Cart.findOne({ where: { user_id }, include: CartItem }); //                           Find the user's cart: this case is in-existant but still for an extra check i am keeping it here...
  if (!cart || cart.CartItems.length === 0)
    return makeError("cart is empty", 400, next);

  const updatedProductIds = updatedCartItems.map((item) => item.product_id); //                            Process updated cart items (quantity changes, removals)

  //                                                                                                       Step 1: Remove items from the cart if they were deleted by the user [in frontend]
  await CartItem.destroy({
    where: {
      cart_id: cart.id,
      product_id: { [Op.notIn]: updatedProductIds },
    },
  });

  //                                                                                                       Step 2: Update existing items' quantities in the cart
  for (let item of updatedCartItems) {
    let cartItem = await CartItem.findOne({
      where: { cart_id: cart.id, product_id: item.product_id },
    });
    if (cartItem) {
      cartItem.quantity = item.quantity;
      await cartItem.save();
    }
  }

  return sendSuccess(res, 200, "check out successful");
});

module.exports = {
  addToCart, //                                                                                           function for adding an item to cart along with quantity... from here the cart story begins...
  getCart, //                                                                                             get all items of cart of a user [obviously from the db. hah ]
  deleteCartItem, //                                                                                      delete a cart item.
  checkout, //                                                                                            i am allowing user to make changes to the quantities of each product / delete an entire product from cart... then upon clicking checkout he can send data to the route of this handler and his modified data will be sync__ed/modified into his db data.
};
