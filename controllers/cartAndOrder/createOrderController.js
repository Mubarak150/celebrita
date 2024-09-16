const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const OrderProduct = require('../../models/OrderProduct');
const Invoice = require('../../models/Invoice');
const {sequelize} = require('../../config/db');

exports.placeOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { user_id, shipping_address, user_contact, payment_type, payment_method } = req.body;

        // Find the user's cart
        const cart = await Cart.findOne({
            where: { user_id },
            include: CartItem,
            transaction
        });

        if (!cart || cart.CartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate total amount while considering discounts
        let totalAmount = 0;
        const cartItems = cart.CartItems;
        for (let item of cartItems) {
            const product = await Product.findByPk(item.product_id, { transaction });
            let discount = product.discount ? product.discount : 0;
            let discountedPrice = product.price * (1 - discount / 100);
            totalAmount += discountedPrice * item.quantity;
        }

        // Create a new order
        const order = await Order.create({
            user_id,
            total_amount: totalAmount,
            shipping_address,
            user_contact,
            payment_type,
            payment_method
        }, { transaction });

        // Add products to the order and update product quantities
        for (let item of cartItems) {
            const product = await Product.findByPk(item.product_id, { transaction });
            let discountedPrice = product.price * (1 - product.discount / 100);
            await OrderProduct.create({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_order: discountedPrice
            }, { transaction });

            // Update product quantity in the Products table
            product.quantity -= item.quantity;
            await product.save({ transaction });
        }

        // Clear the cart after checkout
        await CartItem.destroy({ where: { cart_id: cart.id }, transaction });

        // Generate invoice number
        const lastInvoice = await Invoice.findOne({
            order: [['created_at', 'DESC']],
            transaction
        });

        let nextInvoiceNumber = 'INV-0000000001'; // Default for the first invoice
        if (lastInvoice) {
            const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''), 10);
            nextInvoiceNumber = 'INV-' + String(lastNumber + 1).padStart(10, '0');
        }

        // Create the invoice for this order
        const invoice = await Invoice.create({
            order_id: order.id,
            user_id,
            invoice_number: nextInvoiceNumber,
            payment_status: 'pending', // or 'paid' depending on the flow
            created_at: new Date()
        }, { transaction });

        // Commit the transaction
        await transaction.commit();

        // Respond with success
        res.status(201).json({ success: true, data: { order, invoice } });
    } catch (error) {
        // Rollback the transaction in case of an error
        await transaction.rollback();
        res.status(500).json({ success: false, error: error.message });
    }
};








// const Cart = require('../../models/Cart');
// const CartItem = require('../../models/CartItem');
// const Product = require('../../models/Product');
// const Order = require('../../models/Order');
// const OrderProduct = require('../../models/OrderProduct');

// exports.placeOrder = async (req, res) => {
//     try {
//         const { user_id, shipping_address, user_contact, payment_type, payment_method } = req.body; 

//         // Find the user's cart
//         const cart = await Cart.findOne({ where: { user_id }, include: CartItem });
//         if (!cart || cart.CartItems.length === 0) {
//             return res.status(400).json({ success: false, message: 'Cart is empty' });
//         }

//         // Calculate total amount while considering discounts
//         let totalAmount = 0;
//         const cartItems = cart.CartItems;
//         for (let item of cartItems) {
//             const product = await Product.findByPk(item.product_id);
//             let discount = product.discount ? product.discount : 0;
//             let discountedPrice = product.price * (1 - discount / 100);
//             totalAmount += discountedPrice * item.quantity;
//         }

//         // Create a new order
//         const order = await Order.create({ user_id, total_amount: totalAmount, shipping_address, user_contact, payment_type, payment_method });

//         // Add products to the order and update product quantities
//         for (let item of cartItems) {
//             const product = await Product.findByPk(item.product_id);
//             let discountedPrice = product.price * (1 - product.discount / 100);
//             await OrderProduct.create({
//                 order_id: order.id,
//                 product_id: item.product_id,
//                 quantity: item.quantity,
//                 price_at_order: discountedPrice
//             });

//             // Update product quantity in the Products table
//             product.quantity -= item.quantity;
//             await product.save();
//         }

//         // Clear the cart after checkout
//         await CartItem.destroy({ where: { cart_id: cart.id } });

//         // Generate invoice
        

//         res.status(201).json({ success: true, data: order });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };
