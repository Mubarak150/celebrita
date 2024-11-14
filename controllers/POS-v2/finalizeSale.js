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
        // EXAMPLE:  if sub-total is 260, and discount = 60... then
        discounted_total = sub_total_amount - parseFloat(discount); // 260 - 60 = 200
        discount_amount = parseFloat(discount); // 60
    }

    return {
        discount_amount,
        discounted_total
    };
}

const finalizeSale = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        let { user_id, buyer_name, buyer_contact, discount, payment_method } = req.body;

        if(!discount || discount == "" || discount == " " || discount == "%" || discount == " %"){
            discount = '0%'
        }
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
            let productDiscount = product.discount ? product.discount : 0;
            let discountedPrice = product.price * (1 - productDiscount / 100);

            // Apply proportionate discount to the discounted price
            let proportionateDiscount = (discount_amount / sub_total_amount) * discountedPrice;
            let finalPrice = discountedPrice - proportionateDiscount;

            // Save the final price after subtracting the proportionate discount
            await POSSaleProduct.create({
                sale_id: sale.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_sale: finalPrice
            }, { transaction });

            // Update product quantity in the Products table
            product.quantity -= item.quantity;
            await product.save({ transaction });
        }

        // Clear the cart after checkout
        await SalesCartItems.destroy({ where: { sales_cart_id: sales_cart.id }, transaction });

        // Commit the transaction
        await transaction.commit();

        res.status(201).json({ success: true, message: "sale processed successfully", invoice_id: sale.id });
    } catch (error) {
        // Rollback the transaction in case of an error
        if (transaction.finished !== 'commit') {
            await transaction.rollback();
        }
        res.status(500).json({ success: false, error: error.message });
    }
};


// const finalizeSale = async (req, res) => { // old
//     const transaction = await sequelize.transaction();

//     try {
//         let { user_id, buyer_name, buyer_contact, discount, payment_method } = req.body;

//         if(!discount || discount == "" || discount == " " || discount == "%" || discount == " %"){
//             discount = '0'
//         }
//         // Find the user's cart
//         const sales_cart = await SalesCart.findOne({
//             where: { user_id },
//             include: SalesCartItems,
//             transaction
//         });

//         if (!sales_cart || sales_cart.SalesCartItems.length === 0) {
//             await transaction.rollback(); // Rollback before responding
//             return res.status(400).json({ success: false, message: 'cannot place sale when cart is empty' });
//         }

//         // Calculate total amount while considering discounts
//         let sub_total_amount = 0;
//         const cartItems = sales_cart.SalesCartItems;
//         for (let item of cartItems) {
//             const product = await Product.findByPk(item.product_id, { transaction });
//             let discount = product.discount ? product.discount : 0;
//             let discountedPrice = product.price * (1 - discount / 100);
//             sub_total_amount += discountedPrice * item.quantity;
//         }

//         // calculate the discount and discounted_amount:
//         const { discount_amount, discounted_total } = calculateTotal(sub_total_amount, discount);

//         // Generate sale number
//         const last_sale = await POSSale.findOne({
//             order: [['created_at', 'DESC']],
//             transaction
//         });

//         let next_sale_number = 'SSN-0000000001'; // Default for the first invoice
//         if (last_sale) {
//             const last_sale_number = parseInt(last_sale.sale_number.replace('SSN-', ''), 10);
//             next_sale_number = 'SSN-' + String(last_sale_number + 1).padStart(10, '0');
//         }

//         // Create a new order
//         const sale = await POSSale.create({
//             user_id,
//             sale_number: next_sale_number,
//             buyer_name,
//             buyer_contact,
//             buyer_contact,
//             sub_total_amount,
//             discount: discount_amount,
//             discounted_total,
//             payment_method
//         }, { transaction });

//         // Add products to the order and update product quantities
//         for (let item of cartItems) {
//             const product = await Product.findByPk(item.product_id, { transaction });
//             let discountedPrice = product.price * (1 - product.discount / 100);
//             await POSSaleProduct.create({
//                 sale_id: sale.id,
//                 product_id: item.product_id,
//                 quantity: item.quantity,
//                 price_at_sale: discountedPrice
//             }, { transaction });

//             // Update product quantity in the Products table
//             product.quantity -= item.quantity;
//             await product.save({ transaction });
//         }

//         // Clear the cart after checkout
//         await SalesCartItems.destroy({ where: { sales_cart_id: sales_cart.id }, transaction });

//         // Commit the transaction
//         await transaction.commit();

//         res.status(201).json({ success: true, message: "sale processed successfully", invoice_id: sale.id });
//     } catch (error) {
//         // Rollback the transaction in case of an error
//         if (transaction.finished !== 'commit') {
//             await transaction.rollback();
//         }
//         res.status(500).json({ success: false, error: error.message });
//     }
// };


////////////////////////// GET SALE INVOICE ///////////////////////////////


const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch detailed invoice information
        const detailedInvoice = await POSSale.findOne({
            where: { id },           
            attributes: { exclude: ['id', 'user_id', 'createdAt' ] },
            include: [
                {
                    model: POSSaleProduct,
                    as: 'sale_products',
                    attributes: { exclude: ['id', 'sale_id', 'createdAt', 'updatedAt' ] },
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['name'] 
                        }
                    ]
                }
            ]
        });

        if (!detailedInvoice) {
            return res.status(404).json({ success: false, message: 'Sale Invoice not found' });
        }

        res.status(200).json({status: true, invoice: detailedInvoice}); 

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {finalizeSale, getInvoice}