const Product = require('../../models/Product'); 
const POSSale = require('../../models/POSSale'); 
const POSSaleProduct = require('../../models/POSSaleProduct');  /// 
const SaleReturnProduct = require('../../models/SaleReturnProduct'); 
const SaleReturn = require('../../models/SaleReturn'); 
const { sequelize } = require('../../config/db');

// in first step search an order by #SSN: 
const getSaleBySSN = async (req, res) => {
    try {
        const { ssn } = req.params;

        // Fetch detailed invoice information
        const detailedSale = await POSSale.findOne({
            where: { sale_number: ssn },           
            attributes: { exclude: ['id', 'user_id', 'createdAt' ] }, 
            include: [
                {
                    model: POSSaleProduct,
                    as: 'sale_products',
                    attributes: { exclude: [ 'sale_id', 'createdAt', 'updatedAt' ] },
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

        if (!detailedSale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        res.status(200).json({status: true, invoice: detailedSale}); 

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// remove products from sale and add them to pos_returns table... pos_return_products table... 
const processReturn = async (req, res) => {
    const transaction = await sequelize.transaction(); 
    try {
        // const {  } = req.params; // Sale number to process return for
        const {ssn, returnedProducts} = req.body; // Array of returned products from the frontend

        // Step 1: Fetch original sale and products
        const originalSale = await POSSale.findOne({
            where: { sale_number: ssn },
            include: [
                {
                    model: POSSaleProduct,
                    as: 'sale_products',
                    attributes: ['id', 'product_id', 'quantity', 'price_at_sale'], // Include relevant fields
                },
            ],
            transaction, 
        });

        if (!originalSale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        // Step 2: Prepare return products
        const returnProducts = [];
        const updatedSaleProducts = originalSale.sale_products.map((product) => {
            const returnedProduct = returnedProducts.find((p) => p.id === product.id);
            if (returnedProduct) {
                const originalQuantity = product.quantity;
                const returnedQuantity = returnedProduct.quantity; 

                // Calculate new quantity
                const newQuantity = originalQuantity - returnedQuantity;

                // Step 3: Add to return products if quantity is greater than zero
                if (newQuantity >= 0) {
                    returnProducts.push({
                        sale_product_id: product.id,
                        return_quantity: newQuantity,
                        return_amount: calculateReturnAmount(product.price_at_sale, originalSale.discount, originalSale.sub_total_amount, newQuantity) // calculate the return amount
                    });
                    console.log(product.price_at_sale, originalSale.discount, originalSale.sub_total_amount, newQuantity)
                    product.quantity = newQuantity; // Update the quantity for the sale
                }
            }
            return product;
        });

        // Step 4: Create the return record if there are return products

        
        if (returnProducts.length > 0) {
        // Create a new SaleReturn entry
            // calculate SRN: 
            const last_return = await SaleReturn.findOne({
                order: [['created_at', 'DESC']],
                transaction,
            });

            let next_return_number = 'SRN-0000000001'; // Default for the first invoice
            if (last_return) {
                const last_return_number = parseInt(last_return.sale_return_number.replace('SRN-', ''), 10);
                next_return_number = 'SRN-' + String(last_return_number + 1).padStart(10, '0');
            }

            const saleReturn = await SaleReturn.create({
                sale_return_number: next_return_number,
                sale_id: originalSale.id,
                sales_number: ssn, 
                total_refund: returnProducts.reduce((acc, p) => acc + p.return_amount, 0), // Calculate total return amount
            }, { transaction }); 

            // Populate SaleReturnProduct records
            for (const returnProduct of returnProducts) {
                await SaleReturnProduct.create({
                    sale_return_id: saleReturn.id,
                    product_id: returnProduct.sale_product_id,
                    quantity: returnProduct.return_quantity,
                    refund_amount: returnProduct.return_amount,
                }, { transaction });
            }
        }

        // Step 5: Update the original sale products
        // await Promise.all(
        //     updatedSaleProducts.map((product) =>
        //         POSSaleProduct.update(
        //             { quantity: product.quantity },
        //             { where: { id: product.id }, transaction }
        //         )
        //     )
        // );
        await transaction.commit(); 
        res.status(200).json({ success: true, message: 'Return processed successfully' });

    } catch (error) {
        // Rollback the transaction in case of an error
        if (transaction.finished !== 'commit') {
            await transaction.rollback();
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// Helper function to calculate return amount
const calculateReturnAmount = (priceAtSale, discount, subTotalAmount, returnedQuantity) => {
    console.log(priceAtSale)
    const proportionalDiscount = (discount / subTotalAmount) * priceAtSale; // Calculate proportional discount for the returned product
    return (priceAtSale - proportionalDiscount) * returnedQuantity; // Return amount after discount
};


module.exports = { getSaleBySSN, processReturn}