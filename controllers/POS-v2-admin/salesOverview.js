const POSSales = require('../models/POSSales');  // Adjust the path as needed
const POSSaleReturn = require('../models/POSSaleReturn');
const POSSaleProducts = require('../models/POSSaleProducts');
const SaleReturnProducts = require('../models/SaleReturnProducts');
const Products = require('../models/Products');
const SalesPerson = require('../models/SalesPerson');  // change it to User... 


const adminSalesOverview = async (req, res) => {
    try {
        const { from, to, categories } = req.body;

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
                    },
                    ...(categories ? { '$sale_products.product.category$': { [Op.in]: categories } } : {})
                },
                include: [
                    {
                        model: SalesPerson,
                        attributes: ['name']
                    },
                    {
                        model: POSSaleProducts,
                        as: 'sale_products',
                        attributes: ['quantity'],
                        include: [
                            {
                                model: Products,
                                as: 'product',
                                attributes: ['name', 'category']
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
                    },
                    ...(categories ? { '$return_products.product.category$': { [Op.in]: categories } } : {})
                },
                include: [
                    {
                        model: SalesPerson,
                        attributes: ['name']
                    },
                    {
                        model: SaleReturnProducts,
                        as: 'return_products',
                        attributes: ['quantity'],
                        include: [
                            {
                                model: Products,
                                as: 'product',
                                attributes: ['name', 'category']
                            }
                        ]
                    }
                ],
                attributes: ['sale_return_number', 'sales_number', 'total_refund', 'payment_method']
            });

            // Process sales and returns data
            const dateSummary = {};

            sales.forEach(sale => {
                const salesperson = sale.SalesPerson.name;

                // Initialize the salesperson data for the date
                if (!dateSummary[salesperson]) {
                    dateSummary[salesperson] = {
                        totalSalesAmount: 0,
                        totalCashSales: 0,
                        totalCardSales: 0,
                        sales: []
                    };
                }

                const saleTotal = parseFloat(sale.discounted_total);
                dateSummary[salesperson].totalSalesAmount += saleTotal;

                if (sale.payment_method === 'cash') {
                    dateSummary[salesperson].totalCashSales += saleTotal;
                } else {
                    dateSummary[salesperson].totalCardSales += saleTotal;
                }

                dateSummary[salesperson].sales.push({
                    sale_number: sale.sale_number,
                    sub_total_amount: sale.sub_total_amount,
                    discounted_total: sale.discounted_total
                });
            });

            returns.forEach(ret => {
                const salesperson = ret.SalesPerson.name;

                // Initialize the salesperson data for the date if not already
                if (!dateSummary[salesperson]) {
                    dateSummary[salesperson] = {
                        totalRefundAmount: 0,
                        totalCashReturns: 0,
                        totalCardReturns: 0,
                        returns: []
                    };
                }

                const returnTotal = parseFloat(ret.total_refund);
                dateSummary[salesperson].totalRefundAmount = (dateSummary[salesperson].totalRefundAmount || 0) + returnTotal;

                if (ret.payment_method === 'cash') {
                    dateSummary[salesperson].totalCashReturns = (dateSummary[salesperson].totalCashReturns || 0) + returnTotal;
                } else {
                    dateSummary[salesperson].totalCardReturns = (dateSummary[salesperson].totalCardReturns || 0) + returnTotal;
                }

                dateSummary[salesperson].returns.push({
                    sale_return_number: ret.sale_return_number,
                    total_refund: ret.total_refund
                });
            });

            // Store the aggregated data for this date
            dailyOverview[date] = dateSummary;
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
