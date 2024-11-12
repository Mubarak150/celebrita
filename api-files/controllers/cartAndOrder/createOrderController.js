const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const OrderProduct = require('../../models/OrderProduct');
const Invoice = require('../../models/Invoice');
const Delivery = require('../../models/Delivery');
const User = require('../../models/User');
const { sequelize } = require('../../config/db');
const {notifyAllAdmins} = require('../../utils/socket');

exports.placeOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { user_id, city, shipping_address, user_contact, payment_type, payment_method } = req.body;

        // Find the user's cart
        const cart = await Cart.findOne({
            where: { user_id },
            include: CartItem,
            transaction
        });

        if (!cart || cart.CartItems.length === 0) {
            await transaction.rollback(); // Rollback before responding
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

        // add delivery based on city here from deliveries table.
        let delivery = await Delivery.findOne({ where: {city: city} }); 
        if (!delivery) {
            res.json({status: false, message: "selected city name not found in record"})
        }

        let deliveryCharges = delivery.charges; 
        // IF added on test basis... 
        if(totalAmount >= 6000 ) {
            deliveryCharges = 0; 
        }
        let AmountWithDelivery = totalAmount + deliveryCharges; 




        // Create a new order
        const order = await Order.create({
            user_id,
            total_amount: totalAmount,
            amount_with_delivery: AmountWithDelivery,
            shipping_address,
            city,
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
        const newInvoice = await Invoice.create({
            order_id: order.id,
            user_id,
            invoice_number: nextInvoiceNumber,
            payment_status: 'pending', // or 'paid' depending on the flow
            delivery_charges: deliveryCharges,
            created_at: new Date()
        }, { transaction });

        // Commit the transaction
        await transaction.commit();

        // Fetch detailed invoice information
        const detailedInvoice = await Invoice.findOne({
            where: { id: newInvoice.id },
            include: [
                {
                    model: Order,
                    include: [
                        {
                            model: OrderProduct,
                            include: [Product] // Include Product to get product details
                        },
                        User // Include User to get the user's name
                    ]
                }
            ]
        });

        if (!detailedInvoice) {
            throw new Error('Invoice not found');
        }

        // Extract required data
        const orderDetails = detailedInvoice.Order;
        const orderProducts = orderDetails.OrderProducts.map(orderProduct => ({
            product_name: orderProduct.Product.name, // Assuming `name` is a field in Product model
            quantity: orderProduct.quantity,
            price_at_order: orderProduct.price_at_order
        }));

        const response = {
            invoice_id: detailedInvoice.id,
            order_id: detailedInvoice.order_id,
            invoice_number: detailedInvoice.invoice_number,
            user_name: orderDetails.User.name, // Get the user's name from the User model
            payment_status: detailedInvoice.payment_status,
            created_at: detailedInvoice.created_at,
            total_amount: orderDetails.total_amount,
            delivery_charges: deliveryCharges, // added new
            amount_with_delivery: AmountWithDelivery, // added new
            shipping_address: orderDetails.shipping_address,
            products: orderProducts
        };

        let notificationMessage = `a user ${response.user_name} has placed an order #${order.id}.`;
        notifyAllAdmins(order.id, notificationMessage);

        res.status(201).json({ success: true, data: response });
    } catch (error) {
        // Rollback the transaction in case of an error
        if (transaction.finished !== 'commit') {
            await transaction.rollback();
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
