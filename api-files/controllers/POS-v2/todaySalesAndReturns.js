const POSSales = require('../../models/POSSale')
const POSSaleReturn = require('../../models/SaleReturn'); 
const POSSaleProducts = require('../../models/POSSaleProduct'); 
const Products = require('../../models/Product'); 
const SaleReturnProducts = require('../../models/SaleReturnProduct'); 
const {Op} = require('sequelize')

const todaySalesAndReturns = async (req, res) => {
    try {
        const date = new Date().toISOString().split('T')[0];
        // const date = '2024-10-29'

        // Fetch sales with product details
        const sales = await POSSales.findAll({
            where: {
                user_id: req.body.user.id,
                created_at: {
                    [Op.gte]: new Date(`${date}T00:00:00`),
                    [Op.lte]: new Date(`${date}T23:59:59`)
                }
            },
            include: [
                {
                    model: POSSaleProducts,
                    as: 'sale_products',
                    attributes: ['quantity'],
                    include: [
                        {
                            model: Products,
                            as: 'product',
                            attributes: ['name']
                        }
                    ]
                }
            ],
            attributes: ['sale_number', 'sub_total_amount', 'discount', 'discounted_total', 'payment_method']
        });

        // Fetch returns with product details
        const returns = await POSSaleReturn.findAll({
            where: {
                user_id: req.body.user.id,
                created_at: {
                    [Op.gte]: new Date(`${date}T00:00:00`),
                    [Op.lte]: new Date(`${date}T23:59:59`)
                }
            },
            include: [
                {
                    model: SaleReturnProducts,
                    as: 'return_products',
                    attributes: ['quantity', 'product_id'],
                    include: [
                        {
                            model: POSSaleProducts,
                            as: 'sale_products',
                            attributes: ['id'],
                            include: [
                                {
                                    model: Products,
                                    as: 'product',
                                    attributes: ['id','name']
                                }
                            ]
                        }
                    ]
                }
            ],
            attributes: ['sale_return_number', 'sales_number', 'total_refund', 'payment_method']
        });

        // console.log(sales); 
        // res.status(200).json({sales}); 

        // Sum discounted_total from sales
        const totalSalesAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0);

        // Sum total_refund from returns
        const totalRefundAmount = returns.reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0);

        // Calculate net sales
        const netSales = totalSalesAmount - totalRefundAmount;

        // Calculate total cash for sales where payment_method is 'cash'
        const totalCashSales = sales
            .filter(sale => sale.payment_method === 'cash')
            .reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0);

        // Calculate total cash for returns where payment_method is 'cash'
        const totalCashReturns = returns
            .filter(ret => ret.payment_method === 'cash')
            .reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0);

        // Calculate net total cash
        const netCash = totalCashSales - totalCashReturns;

        // Process each product's sold and returned quantities
        const productSummary = {};

        sales.forEach(sale => {
            sale.sale_products.forEach(saleProduct => {
                const productName = saleProduct.product.name;
                if (!productSummary[productName]) {
                    productSummary[productName] = { sold_quantity: 0, returned_quantity: 0 };
                }
                productSummary[productName].sold_quantity += saleProduct.quantity;
            });
        });

        returns.forEach(ret => {
            ret.return_products.forEach(returnProduct => {
                const productName = returnProduct.sale_products.product.name;
                if (!productSummary[productName]) {
                    productSummary[productName] = { sold_quantity: 0, returned_quantity: 0 };
                }
                productSummary[productName].returned_quantity += returnProduct.quantity;
            });
        });

        // Convert productSummary to an array format for easier JSON representation
        const productSummaryArray = Object.keys(productSummary).map(productName => ({
            name: productName,
            sold_quantity: productSummary[productName].sold_quantity,
            returned_quantity: productSummary[productName].returned_quantity
        }));

        // now i dont want to see products details with each sale and return.... just superfacial data... so: 
        let salesOnly = sales.map(sale => {
            // Convert Sequelize instance to a plain object
            const saleObj = sale.get({ plain: true });
            // Remove `sale_products` from the plain object
            delete saleObj.sale_products;
            return saleObj;
        });

        let returnsOnly = returns.map(ret => {
            // Convert Sequelize instance to a plain object
            const returnObj = ret.get({ plain: true });
            // Remove `return_products` from the plain object
            delete returnObj.return_products;
            return returnObj;
        });

        res.status(200).json({
            salesOnly,
            returnsOnly,
            totalSalesAmount,
            totalRefundAmount,
            netSales,
            totalCashSales,
            totalCashReturns,
            totalCardSales: totalSalesAmount - totalCashSales,
            totalCardReturns: totalRefundAmount - totalCashReturns,
            netCash,
            productSummary: productSummaryArray
        });
    } catch (error) {
        console.log(error.message, error);
        res.status(500).json({
            status: false,
            message: 'Error occurred while fetching your sales and returns'
        });
    }
};





module.exports = { todaySalesAndReturns }