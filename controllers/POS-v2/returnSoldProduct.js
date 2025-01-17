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
        
        if (detailedSale.returned) {
            return res.status(400).json({ success: false, message: `A return has already been made from this Sale: ${ssn}` });
        }

        res.status(200).json({status: true, invoice: detailedSale}); 

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getSaleBySSNforPopUp = async (req, res) => {
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


const processReturn = async (req, res) => {
    const transaction = await sequelize.transaction(); 
    try {
        let { ssn, payment_method, returnedProducts } = req.body;

        if (!payment_method) {
            payment_method = 'cash';
        }

        // Step 1: Fetch original sale and products
        const originalSale = await POSSale.findOne({
            where: { sale_number: ssn },
            include: [
                {
                    model: POSSaleProduct,
                    as: 'sale_products',
                    attributes: ['id', 'product_id', 'quantity', 'price_at_sale'],
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
                if (newQuantity > 0) {
                    returnProducts.push({
                        sale_product_id: product.id,
                        return_quantity: newQuantity,
                        return_amount: calculateReturnAmount(
                            product.price_at_sale,
                            originalSale.discount,
                            originalSale.sub_total_amount,
                            newQuantity
                        ),
                    });
                    product.quantity = newQuantity;
                }
            }
            return product;
        });

        // Step 4: Create the return record if there are return products
        if (returnProducts.length > 0) {
            // Calculate SRN
            const last_return = await SaleReturn.findOne({
                order: [['created_at', 'DESC']],
                transaction,
            });

            let next_return_number = 'SRN-0000000001';
            if (last_return) {
                const last_return_number = parseInt(last_return.sale_return_number.replace('SRN-', ''), 10);
                next_return_number = 'SRN-' + String(last_return_number + 1).padStart(10, '0');
            }

            const saleReturn = await SaleReturn.create(
                {
                    user_id: req.body.user.id,
                    sale_return_number: next_return_number,
                    sale_id: originalSale.id,
                    sales_number: ssn,
                    total_refund: returnProducts.reduce((acc, p) => acc + p.return_amount, 0),
                    payment_method: payment_method,
                },
                { transaction }
            );

            // Populate SaleReturnProduct records
            for (const returnProduct of returnProducts) {
                await SaleReturnProduct.create(
                    {
                        sale_return_id: saleReturn.id,
                        product_id: returnProduct.sale_product_id,
                        quantity: returnProduct.return_quantity,
                        refund_amount: returnProduct.return_amount,
                    },
                    { transaction }
                );
            }

            // Step 6: Add returned quantities back to Product table
            for (const returnProduct of returnProducts) {
                const saleProduct = await POSSaleProduct.findOne({
                    where: { id: returnProduct.sale_product_id },
                    attributes: ['product_id'],
                    transaction,
                });

                if (saleProduct) {
                    await Product.increment(
                        { quantity: returnProduct.return_quantity },
                        { where: { id: saleProduct.product_id }, transaction }
                    );
                }
        }}

        // Step 5: Update the original sale as returned
        await POSSale.update(
            { returned: true },
            { where: { sale_number: ssn }, transaction }
        );

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Return processed successfully' });

    } catch (error) {
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
    return (priceAtSale) * returnedQuantity; // Return amount after discount
};

const getReturnBySRN = async (req, res) => {
    try {
        const { srn } = req.params;

        // Fetch detailed return information
        const detailedReturn = await SaleReturn.findOne({
            where: { sale_return_number: srn }, // Match return_number with srn
            attributes: { exclude: ['id', 'sale_id', 'user_id', 'remarks', 'createdAt', 'updatedAt'] }, 
            include: [
                {
                    model: SaleReturnProduct,
                    as: 'return_products',
                    attributes: { exclude: ['sale_return_id', 'createdAt', 'updatedAt'] },
                    include: [
                        {
                            model: POSSaleProduct,
                            as: 'sale_products', // Intermediate model
                            attributes: ['product_id'], // fields of it excluded.. not needed. 
                            include: [
                                {
                                    model: Product,
                                    as: 'product', // Final product association
                                    attributes: ['name'] // Include product name
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!detailedReturn) {
            return res.status(404).json({ success: false, message: 'Return not found' });
        }

        res.status(200).json({ status: true, returnDetails: detailedReturn });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};



module.exports = { getSaleBySSN, getSaleBySSNforPopUp, processReturn, getReturnBySRN}