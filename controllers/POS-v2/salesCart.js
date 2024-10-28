const SalesCartItem = require('../../models/SalesCartItems'); 
const SalesCart = require('../../models/SalesCart'); 
const Product = require('../../models/Product'); 

const addToSalesCart = async (req, res) => {
    try {
        const { user_id } = req.body;
        const { barcode } = req.params; 

        // Find the user's cart
        let sales_cart = await SalesCart.findOne({ where: { user_id } });
        if (!sales_cart) {
            sales_cart = await SalesCart.create({ user_id });
        }

        // Fetch the product to check available stock
        const product = await Product.findOne( {where: {barcode}});
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found' });
        }

        if (product.quantity == 0) {
            return res.status(400).json({ status: false, message: 'Product:  Out Of Stock' });
        }

        // Check if the quantity exceeds available stock
        let salesCartItem = await SalesCartItem.findOne({ where: { sales_cart_id: sales_cart.id, product_barcode: barcode } });
        let currentQuantity = salesCartItem ? salesCartItem.quantity : 0;
        let newTotalQuantity = currentQuantity+1;

        if (newTotalQuantity > product.quantity) {
            return res.status(400).json({ 
                status: false, 
                message: `Cannot add to cart. Available stock: ${product.quantity}, while your current quantity (including previously selected) is: ${newTotalQuantity}` 
            });
        }

        // Update quantity if the product already exists in the cart
        if (salesCartItem) {
            salesCartItem.quantity = newTotalQuantity;
            await salesCartItem.save();
        } else {
            // Add a new cart item
            await SalesCartItem.create({ sales_cart_id: sales_cart.id,
                                         product_id: product.id, 
                                         quantity: 1, 
                                         product_barcode: barcode
                                       });
        }

        res.status(201).json({ status: true, message: 'Product added to cart' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};


///////////////////////////////////////////////

const fetchSalesCart = async (req, res) => {
    try {
        const  user_id  = req.body.user_id;

        const sales_cart = await SalesCart.findOne({ where: { user_id }, include: SalesCartItem });
        if (!sales_cart || sales_cart.SalesCartItems.length === 0) {
            return res.status(200).json({ success: true, message: 'Cart is empty' });
        }

        const salesCartDetails = await Promise.all(sales_cart.SalesCartItems.map(async (item) => {
            const product = await Product.findByPk(item.product_id, {
                attributes: ['name', 'price', 'discount', 'quantity']
            });
            const discounted_price = product.price * (1 - product.discount / 100);
            
            return {
                id: item.id, 
                product_name: product.name,
                quantity: item.quantity,
                stock: product.quantity,
                discounted_price,
                item_total_amount: discounted_price * item.quantity // Add total_amount calculation here
            };
        }));
        
        const cart_total_amount = salesCartDetails.reduce((acc, item) => acc + (item.discounted_price * item.quantity), 0);
        
        res.status(200).json({
            success: true,
            message: 'Cart details fetched successfully',
            cart_total_amount,
            cart: salesCartDetails
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

//////////////////////////////

const deleteItemFromSalesCart = async (req, res) => {
    const { item_id } = req.params;
    if (!item_id) return res.status(400).json({ status: false, message: 'Item ID is required' });

    try {
        const deletedItem = await SalesCartItem.destroy({where: { id: item_id }});
        if (deletedItem === 0) return res.status(404).json({ status: true, message: 'Item not found' });
        res.status(200).json({ status: true, message: 'Item deleted successfully' });

    } catch (error) {
        res.status(500).json({ status: false, message: 'An error occurred while deleting the item', error: error.message });
    }
}

module.exports = { addToSalesCart, fetchSalesCart, deleteItemFromSalesCart }; 