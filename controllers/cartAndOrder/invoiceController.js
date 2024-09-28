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

// Async function to retrieve all invoices
exports.getAllInvoices = async (req, res) => {
    try {
        let invoices; 
        if(req.body.user.role === '1') {
            // Fetch all invoices with their associated orders and other required data
            invoices = await Invoice.findAll({
                include: [
                    {
                        model: Order,
                        include: [
                            {
                                model: OrderProduct,
                                include: [Product] // Include Product to get product details
                            },
                            User // Include User to get user details like name
                        ]
                    }
                ]
            });
        } else if (req.body.user.role === '2') {
            // Fetch all invoices with their associated orders and other required data
            invoices = await Invoice.findAll({
                where: {user_id: req.body.user.id},
                include: [
                    {
                        model: Order,
                        include: [
                            {
                                model: OrderProduct,
                                include: [Product] // Include Product to get product details
                            },
                            User // Include User to get user details like name
                        ]
                    }
                ]
            });
        }
        

        if (!invoices || invoices.length === 0) {
            return res.status(404).json({ success: false, message: 'No invoices found' });
        }

        // Map through each invoice and construct the necessary data
        const detailedInvoices = await Promise.all(invoices.map(async (invoice) => {
            const orderDetails = invoice.Order;

            // Fetch the delivery charges based on the city in the order
            const delivery = await Delivery.findOne({
                where: { city: orderDetails.city }
            });

            if (!delivery) {
                return res.status(404).json({ success: false, message: 'Delivery charges for city not found' });
            }

            const deliveryCharges = delivery.charges;
            const totalAmount = orderDetails.total_amount;
            const amountWithDelivery = totalAmount + deliveryCharges;

            // Construct the response object for each invoice
            return {
                invoice_id: invoice.id,
                order_id: invoice.order_id,
                invoice_number: invoice.invoice_number,
                created_at: invoice.created_at,
                return_date: orderDetails.return_payment_date, // Assuming this exists in Order model
                amount: amountWithDelivery,
                payment_status: orderDetails.payment_status,
                payment_method: orderDetails.payment_type, // Assuming this exists in Order model
            };
        }));

        // Send the response with all detailed invoices
        res.status(200).json({ success: true, data: detailedInvoices });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};