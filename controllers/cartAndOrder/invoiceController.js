const Product = require('../../models/Product');
const Order = require('../../models/Order');
const OrderProduct = require('../../models/OrderProduct');
const Invoice = require('../../models/Invoice');
const Delivery = require('../../models/Delivery');
const User = require('../../models/User');

// Async function to handle invoice retrieval
exports.getInvoice = async (req, res) => {
    try {
        const { order_id } = req.params;

        // Fetch detailed invoice information
        const detailedInvoice = await Invoice.findOne({
            where: { order_id },
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
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        // Extract order details
        const orderDetails = detailedInvoice.Order;

        // Fetch the delivery charges based on the city in the order
        const delivery = await Delivery.findOne({
            where: { city: orderDetails.city }
        });

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery charges for city not found' });
        }

        // Calculate total amount with delivery charges
        const deliveryCity = delivery.city;
        const deliveryCharges = delivery.charges;
        const totalAmount = orderDetails.total_amount;
        const amountWithDelivery = totalAmount + deliveryCharges;

        // Extract product details from the order
        const orderProducts = orderDetails.OrderProducts.map(orderProduct => ({
            product_name: orderProduct.Product.name, // Assuming `name` is a field in Product model
            quantity: orderProduct.quantity,
            price_at_order: orderProduct.price_at_order
        }));

        // Prepare the response
        const response = {
            invoice_id: detailedInvoice.id,
            order_id: detailedInvoice.order_id,
            invoice_number: detailedInvoice.invoice_number,
            user_name: orderDetails.User.name, 
            delivery_city: deliveryCity,
            payment_status: detailedInvoice.payment_status,
            created_at: detailedInvoice.created_at,
            total_amount: totalAmount,
            delivery_charges: deliveryCharges,
            amount_with_delivery: amountWithDelivery,
            shipping_address: orderDetails.shipping_address,
            products: orderProducts,
            //addded to show the transiction details. 
            transiction_id: orderDetails.transiction_id,
            transiction_date: orderDetails.transiction_date,

        };

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
