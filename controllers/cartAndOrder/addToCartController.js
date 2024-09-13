const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');
const {Op} = require('sequelize'); 

const addToCart = async (req, res) => {
    try {
        const { user_id, product_id, quantity } = req.body;

        // Find the user's cart
        let cart = await Cart.findOne({ where: { user_id } });
        if (!cart) {
            cart = await Cart.create({ user_id });
        }

        // Fetch the product to check available stock
        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found' });
        }

        // Check if the quantity exceeds available stock
        let cartItem = await CartItem.findOne({ where: { cart_id: cart.id, product_id } });
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        const totalQuantity = currentQuantity + quantity;

        if (totalQuantity > product.quantity) {
            return res.status(400).json({ 
                status: false, 
                message: `Cannot add to cart. Available stock: ${product.quantity}, while your current quantity (including previously selected) is: ${totalQuantity}` 
            });
        }

        // Update quantity if the product already exists in the cart
        if (cartItem) {
            return res.status(400).json({status: false, message: "item already in cart, please visit your cart to alter quantity."})
            // cartItem.quantity = totalQuantity;
            // await cartItem.save();
        } else {
            // Add a new cart item
            await CartItem.create({ cart_id: cart.id, product_id, quantity });
        }

        res.status(201).json({ status: true, message: 'Product added to cart' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
const getCart = async (req, res) => {
    try {
        const  user_id  = req.body.user_id;

        // Find the user's cart
        const cart = await Cart.findOne({ where: { user_id }, include: CartItem });
        if (!cart || cart.CartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Fetch product details for each cart item
        const cartDetails = await Promise.all(cart.CartItems.map(async item => {
            const product = await Product.findByPk(item.product_id, {
                attributes: ['name', 'price', 'discount', 'thumbnail']
            });
            return {
                product_name: product.name,
                quantity: item.quantity,
                price: product.price,
                thumbnail: product.thumbnail
            };
        }));

        // Return the cart details
        res.status(200).json({ success: true, data: cartDetails });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const checkout = async (req, res) => {
    try {
        const { user_id, updatedCartItems } = req.body;

        // Find the user's cart: this case is in-existant but still for an extra check i am keeping it here... 
        const cart = await Cart.findOne({ where: { user_id }, include: CartItem });
        if (!cart || cart.CartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Process updated cart items (quantity changes, removals)
        const updatedProductIds = updatedCartItems.map(item => item.product_id);

        // Step 1: Remove items from the cart if they were deleted by the user
        await CartItem.destroy({
            where: {
                cart_id: cart.id,
                product_id: { [Op.notIn]: updatedProductIds }
            }
        });

        // Step 2: Update existing items' quantities in the cart
        for (let item of updatedCartItems) {
            let cartItem = await CartItem.findOne({ where: { cart_id: cart.id, product_id: item.product_id } });
            if (cartItem) {
                cartItem.quantity = item.quantity;
                await cartItem.save();
            }
        }

        res.status(200).json({ success: true, message: 'Cart updated successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    addToCart, // function for adding an item to cart along with quantity... from here the cart story begins... 
    getCart, // get all items of cart of a user [obviously from the db. hah ]
    checkout // i am allowing user to make changes to the quantities of each product / delete an entire product from cart... then upon clicking checkout he can send data to the route of this handler and his modified data will be sync__ed/modified into his db data. 
}