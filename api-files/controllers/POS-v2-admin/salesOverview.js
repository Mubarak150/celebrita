const { Op } = require('sequelize');
const {sequelize} = require('../../config/db')
const User = require('../../models/User');
const Products = require('../../models/Product');
const POSSales = require('../../models/POSSale');
const POSSaleProducts = require('../../models/POSSaleProduct');
const POSSaleReturn = require('../../models/SaleReturn');
const SaleReturnProducts = require('../../models/SaleReturnProduct');
const Category = require('../../models/Category');


const adminSalesOverview = async (req, res) => {
    try {
        let { from, to, categories } = req.query;
        categories = categories ? JSON.parse(categories) : [];
         from = new Date(from).toISOString().split('T')[0];
         to = new Date(to).toISOString().split('T')[0];
         console.log(from, to)

        // Step 1: Fetch sales data with category filter
        const sales = await POSSales.findAll({
            where: {
                    created_at: {
                        [Op.gte]: new Date(`${from}T00:00:00`),
                        [Op.lte]: new Date(`${to}T23:59:59`)
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
                            attributes: ['name', 'category_id'],
                            where: categories.length > 0 ? {
                                category_id: {
                                    [Op.in]: categories
                                }
                            } : {}
                        }
                    ]
                }
            ],
            attributes: ['sale_number', 'sub_total_amount', 'discount', 'discounted_total', 'payment_method']
        });

        // Step 2: Fetch return data with category filter
        const returns = await POSSaleReturn.findAll({
            where: {
                    created_at: {
                        [Op.gte]: new Date(`${from}T00:00:00`),
                        [Op.lte]: new Date(`${to}T23:59:59`)
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
                                    attributes: ['id', 'name', 'category_id'],
                                    where: categories.length > 0 ? {
                                        category_id: {
                                            [Op.in]: categories
                                        }
                                    } : {}
                                }
                            ]
                        }
                    ]
                }
            ],
            attributes: ['sale_return_number', 'sales_number', 'total_refund', 'payment_method']
        });

        // Check if no products match the selected categories
        const productsFound = sales.some(sale => sale.sale_products.some(sp => sp.product))
            || returns.some(ret => ret.return_products.some(rp => rp.sale_products && rp.sale_products.product));
        
        if (categories.length > 0 && !productsFound) {
            return res.status(200).json({
                message: 'no data available for this request',
                salesOnly: [],
                returnsOnly: [],
                totalSalesAmount: 0,
                totalRefundAmount: 0,
                netSales: 0,
                totalCashSales: 0,
                totalCashReturns: 0,
                totalCardSales: 0,
                totalCardReturns: 0,
                netCash: 0,
                productSummary: []
            });
        }

        // Process sales and returns if data is found
        const totalSalesAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0);
        const totalRefundAmount = returns.reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0);
        const netSales = totalSalesAmount - totalRefundAmount;

        const totalCashSales = sales
            .filter(sale => sale.payment_method === 'cash')
            .reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0);

        const totalCashReturns = returns
            .filter(ret => ret.payment_method === 'cash')
            .reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0);

        const netCash = totalCashSales - totalCashReturns;

        const productSummary = {};

        sales.forEach(sale => {
            sale.sale_products.forEach(saleProduct => {
                if (saleProduct.product) {
                    const productName = saleProduct.product.name;
                    if (!productSummary[productName]) {
                        productSummary[productName] = { sold_quantity: 0, returned_quantity: 0 };
                    }
                    productSummary[productName].sold_quantity += saleProduct.quantity;
                }
            });
        });

        returns.forEach(ret => {
            ret.return_products.forEach(returnProduct => {
                if (returnProduct.sale_products && returnProduct.sale_products.product) {
                    const productName = returnProduct.sale_products.product.name;
                    if (!productSummary[productName]) {
                        productSummary[productName] = { sold_quantity: 0, returned_quantity: 0 };
                    }
                    productSummary[productName].returned_quantity += returnProduct.quantity;
                }
            });
        });

        const productSummaryArray = Object.keys(productSummary).map(productName => ({
            name: productName,
            sold_quantity: productSummary[productName].sold_quantity,
            returned_quantity: productSummary[productName].returned_quantity
        }));

        res.status(200).json({
            salesOnly: sales.map(sale => {
                const saleObj = sale.get({ plain: true });
                delete saleObj.sale_products;
                return saleObj;
            }),
            returnsOnly: returns.map(ret => {
                const returnObj = ret.get({ plain: true });
                delete returnObj.return_products;
                return returnObj;
            }),
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


const overviewSalesmen = async (req, res) => {
    try {
        const { from, to } = req.query;

        // Convert date strings to Date objects and generate the date range
        const startDate = new Date(from);
        const endDate = new Date(to);
        const dates = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d).toISOString().split('T')[0]);
        }

        // Initialize an object to store data by date
        const dailyOverview = {};

        // Loop over each date and fetch sales and returns for that date
        for (let date of dates) {
            // Fetch sales for each day
            const sales = await POSSales.findAll({
                where: {
                    created_at: {
                        [Op.gte]: new Date(`${date}T00:00:00`),
                        [Op.lte]: new Date(`${date}T23:59:59`)
                    }
                },
                include: [
                    {
                        model: User,
                        where: { role: '3' },  // salesperson role
                        attributes: ['name'],
                    },
                    {
                        model: POSSaleProducts,
                        as: 'sale_products',
                        attributes: ['quantity'],
                        include: [
                            {
                                model: Products,
                                as: 'product',
                                attributes: ['name', 'category_id']
                            }
                        ]
                    }
                ],
                attributes: ['sale_number', 'sub_total_amount', 'discount', 'discounted_total', 'payment_method']
            });

            // Fetch returns for each day
            const returns = await POSSaleReturn.findAll({
                where: {
                    created_at: {
                        [Op.gte]: new Date(`${date}T00:00:00`),
                        [Op.lte]: new Date(`${date}T23:59:59`)
                    }
                },
                include: [
                    {
                        model: User,
                        where: { role: '3' }, // salesperson role
                        attributes: ['name']
                    },
                    {
                        model: SaleReturnProducts,
                        as: 'return_products',
                        attributes: ['quantity'],
                        include: [
                            {
                                model: POSSaleProducts, // Linking through POSSaleProduct
                                as: 'sale_products',
                                attributes: [],
                                include: [
                                    {
                                        model: Products, // Products associated with POSSaleProduct
                                        as: 'product',
                                        attributes: ['name', 'category_id']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                attributes: ['sale_return_number', 'sales_number', 'total_refund', 'payment_method']
            });

            // Process sales and returns data
            const dateSummary = {};
            let totalSalesAmount = 0;
            let totalCashSales = 0;
            let totalCardSales = 0;
            let totalReturnsAmount = 0;
            let totalCashReturns = 0;
            let totalCardReturns = 0;

            sales.forEach(sale => {
                const salesperson = sale.User.name;

                // Initialize the salesperson data for the date
                if (!dateSummary[salesperson]) {
                    dateSummary[salesperson] = {
                        totalSalesAmount: 0,
                        totalCashSales: 0,
                        totalCardSales: 0,
                        sales: [],
                        returns: []
                    };
                }

                const saleTotal = parseFloat(sale.discounted_total);
                dateSummary[salesperson].totalSalesAmount += saleTotal;
                totalSalesAmount += saleTotal; // Track total sales amount for the day

                if (sale.payment_method === 'cash') {
                    dateSummary[salesperson].totalCashSales += saleTotal;
                    totalCashSales += saleTotal; // Track total cash sales for the day
                } else {
                    dateSummary[salesperson].totalCardSales += saleTotal;
                    totalCardSales += saleTotal; // Track total card sales for the day
                }

                dateSummary[salesperson].sales.push({
                    sale_number: sale.sale_number,
                    sub_total_amount: sale.sub_total_amount,
                    discounted_total: sale.discounted_total,
                    payment_method: sale.payment_method
                });
            });

            returns.forEach(ret => {
                const salesperson = ret.User.name;

                // Initialize the salesperson data for the date if not already
                if (!dateSummary[salesperson]) {
                    dateSummary[salesperson] = {
                        totalRefundAmount: 0,
                        totalCashReturns: 0,
                        totalCardReturns: 0,
                        sales: [],
                        returns: []
                    };
                }

                const returnTotal = parseFloat(ret.total_refund);
                dateSummary[salesperson].totalRefundAmount = (dateSummary[salesperson].totalRefundAmount || 0) + returnTotal;
                totalReturnsAmount += returnTotal; // Track total returns amount for the day

                if (ret.payment_method === 'cash') {
                    dateSummary[salesperson].totalCashReturns = (dateSummary[salesperson].totalCashReturns || 0) + returnTotal;
                    totalCashReturns += returnTotal; // Track total cash returns for the day
                } else if (ret.payment_method === 'card') {
                    dateSummary[salesperson].totalCardReturns = (dateSummary[salesperson].totalCardReturns || 0) + returnTotal;
                    totalCardReturns += returnTotal; // Track total card returns for the day
                }

                dateSummary[salesperson].returns.push({
                    sale_return_number: ret.sale_return_number,
                    total_refund: ret.total_refund,
                    payment_method: ret.payment_method
                });
            });

            // Calculate net sales, net cash sales, and net card sales for the day
            const netSales = totalSalesAmount - totalReturnsAmount;
            const netCashSales = totalCashSales - totalCashReturns;
            const netCardSales = totalCardSales - totalCardReturns;

            // Store the aggregated data for this date
            dailyOverview[date] = {
                dateSummary,
                dailyTotals: {
                    totalSalesAmount,
                    totalCashSales,
                    totalCardSales,
                    totalReturnsAmount,
                    totalCashReturns,
                    totalCardReturns,
                    netSales,
                    netCashSales,
                    netCardSales
                }
            };
        }

        res.status(200).json({
            success: true,
            message: 'Admin sales overview fetched successfully',
            data: dailyOverview
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error occurred while fetching admin sales overview',
            error: error.message
        });
    }
};


module.exports = {adminSalesOverview, overviewSalesmen}; 