const SalesCart = require('../../models/SalesCart');
const SalesCartItems = require('../../models/SalesCartItems');
const Product = require('../../models/Product');
const POSSale = require('../../models/POSSale')
const POSSaleProduct = require('../../models/POSSaleProduct');
const Invoice = require('../../models/Invoice');
const Delivery = require('../../models/Delivery');
const User = require('../../models/User');
const { sequelize } = require('../../config/db');
const {notifyAllAdmins} = require('../../utils/socket');

function calculateTotal(sub_total_amount, discount) {
    let discount_amount; // how much discount is made
    let discounted_total; // how much amount is due after subtracting the abve from sub total. 

    // Check if discount is a percentage
    if (discount.includes('%')) {
        // Convert percentage to a decimal and calculate discount
        const discountPercentage = parseFloat(discount) / 100;
        discount_amount = sub_total_amount * discountPercentage;
        discounted_total = sub_total_amount - discount_amount;
    } else {
        // If it's a flat amount
        discounted_total = sub_total_amount - parseFloat(discount);
        discount_amount = parseFloat(discount);
    }

    return {
        discount_amount,
        discounted_total
    };
}

const finalizeSale = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { user_id, buyer_name, buyer_contact, discount, payment_method } = req.body;

        // Find the user's cart
        const sales_cart = await SalesCart.findOne({
            where: { user_id },
            include: SalesCartItems,
            transaction
        });

        if (!sales_cart || sales_cart.SalesCartItems.length === 0) {
            await transaction.rollback(); // Rollback before responding
            return res.status(400).json({ success: false, message: 'cannot place sale when cart is empty' });
        }

        // Calculate total amount while considering discounts
        let sub_total_amount = 0;
        const cartItems = sales_cart.SalesCartItems;
        for (let item of cartItems) {
            const product = await Product.findByPk(item.product_id, { transaction });
            let discount = product.discount ? product.discount : 0;
            let discountedPrice = product.price * (1 - discount / 100);
            sub_total_amount += discountedPrice * item.quantity;
        }

        // calculate the discount and discounted_amount:
        const { discount_amount, discounted_total } = calculateTotal(sub_total_amount, discount);

        // Generate sale number
        const last_sale = await POSSale.findOne({
            order: [['created_at', 'DESC']],
            transaction
        });

        let next_sale_number = 'SSN-0000000001'; // Default for the first invoice
        if (last_sale) {
            const last_sale_number = parseInt(last_sale.sale_number.replace('SSN-', ''), 10);
            next_sale_number = 'SSN-' + String(last_sale_number + 1).padStart(10, '0');
        }


        // Create a new order
        const sale = await POSSale.create({
            user_id,
            sale_number: next_sale_number,
            buyer_name,
            buyer_contact,
            buyer_contact,
            sub_total_amount,
            discount: discount_amount,
            discounted_total,
            payment_method
        }, { transaction });

        // Add products to the order and update product quantities
        for (let item of cartItems) {
            const product = await Product.findByPk(item.product_id, { transaction });
            let discountedPrice = product.price * (1 - product.discount / 100);
            await POSSaleProduct.create({
                sale_id: sale.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_sale: discountedPrice
            }, { transaction });

            // Update product quantity in the Products table
            product.quantity -= item.quantity;
            await product.save({ transaction });
        }

        // Clear the cart after checkout
        await SalesCartItems.destroy({ where: { sales_cart_id: sales_cart.id }, transaction });

        // Create the invoice for this order
        // const newInvoice = await Invoice.create({
        //     order_id: order.id,
        //     user_id,
        //     invoice_number: nextInvoiceNumber,
        //     payment_status: 'pending', // or 'paid' depending on the flow
        //     delivery_charges: deliveryCharges,
        //     created_at: new Date()
        // }, { transaction });

        // Commit the transaction
        await transaction.commit();

        // Fetch detailed invoice information
        // const detailedInvoice = await Invoice.findOne({
        //     where: { id: newInvoice.id },
        //     include: [
        //         {
        //             model: Order,
        //             include: [
        //                 {
        //                     model: OrderProduct,
        //                     include: [Product] // Include Product to get product details
        //                 },
        //                 User // Include User to get the user's name
        //             ]
        //         }
        //     ]
        // });

        // if (!detailedInvoice) {
        //     throw new Error('Invoice not found');
        // }

        // // Extract required data
        // const orderDetails = detailedInvoice.Order;
        // const orderProducts = orderDetails.OrderProducts.map(orderProduct => ({
        //     product_name: orderProduct.Product.name, // Assuming `name` is a field in Product model
        //     quantity: orderProduct.quantity,
        //     price_at_order: orderProduct.price_at_order
        // }));

        // const response = {
        //     invoice_id: detailedInvoice.id,
        //     order_id: detailedInvoice.order_id,
        //     invoice_number: detailedInvoice.invoice_number,
        //     user_name: orderDetails.User.name, // Get the user's name from the User model
        //     payment_status: detailedInvoice.payment_status,
        //     created_at: detailedInvoice.created_at,
        //     total_amount: orderDetails.total_amount,
        //     delivery_charges: deliveryCharges, // added new
        //     amount_with_delivery: AmountWithDelivery, // added new
        //     shipping_address: orderDetails.shipping_address,
        //     products: orderProducts
        // };

        // let notificationMessage = `a user ${response.user_name} has placed an order #${order.id}.`;
        // notifyAllAdmins(order.id, notificationMessage);

        res.status(201).json({ success: true, data: "sale processed successfully" });
    } catch (error) {
        // Rollback the transaction in case of an error
        if (transaction.finished !== 'commit') {
            await transaction.rollback();
        }
        console.log("error: ", error, error.message)
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {finalizeSale}