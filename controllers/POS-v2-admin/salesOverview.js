const { Op } = require('sequelize');
const {sequelize} = require('../../config/db')
const User = require('../../models/User');
const Products = require('../../models/Product');
const POSSales = require('../../models/POSSale');
const POSSaleProducts = require('../../models/POSSaleProduct');
const POSSaleReturn = require('../../models/SaleReturn');
const SaleReturnProducts = require('../../models/SaleReturnProduct');
const Category = require('../../models/Category');

// const adminSalesOverview = async (req, res) => {
//     try {
//         const { from, to, categories } = req.query;

//         // 1. Array of Sales by Date
//         const salesByDate = await POSSale.findAll({
//             where: {
//                 createdAt: { [Op.between]: [from, to] },
//             },
//             include: {
//                 model: POSSaleProduct,
//                 as: 'sale_products',
//                 attributes: ['product_id', 'quantity'],
//             },
//             attributes: ['id', 'sale_number', 'createdAt'],
//             order: [['createdAt', 'ASC']],
//         });

//         // 2. Array of Returns by Date
//         const returnsByDate = await SaleReturn.findAll({
//             where: {
//                 return_date: { [Op.between]: [from, to] },
//             },
//             include: {
//                 model: SaleReturnProduct,
//                 as: 'return_products',
//                 attributes: ['product_id', 'quantity'],
//             },
//             attributes: ['id', 'sale_return_number', 'return_date'],
//             order: [['return_date', 'ASC']],
//         });

// // 3. Array of Products Sold & Returned by Category
// const productsByCategory = await Product.findAll({
//     where: {
//         category_id: { [Op.in]: categories },
//     },
//     include: [
//         {
//             model: POSSaleProduct, // Sales associated with the product
//             attributes: ['quantity'],
//             include: [
//                 {
//                     model: POSSale, // Sales details within the date range
//                     where: {
//                         createdAt: { [Op.between]: [from, to] },
//                     },
//                 },
//             ],
//         },
//         {
//             model: POSSaleProduct, // Sales products related to returns
//             attributes: [],  // No direct attributes from POSSaleProduct
//             include: [
//                 {
//                     model: SaleReturnProduct, // Linking returns through POSSaleProduct //
//                     attributes: ['quantity'],
//                     include: [
//                         {
//                             model: SaleReturn, // Return details within the date range
//                             where: {
//                                 return_date: { [Op.between]: [from, to] },
//                             },
//                         },
//                     ],
//                 },
//             ],
//         },
//     ],
// });

// console.log(productsByCategory, '*******************************************************************************')
// // Map the results to format them as needed
// const vendorSummary = productsByCategory.map((vendor) => ({
//     vendor_id: vendor.id,
//     vendor_name: vendor.name,
//     cashSale: vendor.POSSales.filter((sale) => sale.payment_method === 'cash' && !sale.returned)
//         .reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0),
//     cardSale: vendor.POSSales.filter((sale) => sale.payment_method === 'card' && !sale.returned)
//         .reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0),
//     cashReturn: vendor.SaleReturns.filter((ret) => ret.payment_method === 'cash')
//         .reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0),
//     cardReturn: vendor.SaleReturns.filter((ret) => ret.payment_method === 'card')
//         .reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0),
//     netCashSale:
//         vendor.POSSales.filter((sale) => sale.payment_method === 'cash' && !sale.returned)
//             .reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0) -
//         vendor.SaleReturns.filter((ret) => ret.payment_method === 'cash')
//             .reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0),
//     netCardSale:
//         vendor.POSSales.filter((sale) => sale.payment_method === 'card' && !sale.returned)
//             .reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0) -
//         vendor.SaleReturns.filter((ret) => ret.payment_method === 'card')
//             .reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0),
// }));

// // return vendorSummary;


//         res.json({
//             salesByDate,
//             returnsByDate,
//             vendorSummary,
//             // productsByCategory,
//             paymentOverview,
//         });
//     } catch (error) {
//         console.error('Error in sales summary:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };
const adminSalesOverview = async (req, res) => {
    try {
        let { from, to, categories } = req.query;
 categories = categories ? JSON.parse(categories) : [];
 from = from ? new Date(from) : null;
 to = to ? new Date(to) : null;

// Now you can safely use parsedCategories, parsedFrom, and parsedTo in your query.


        // Step 1: Fetch sales data with category filter
        const sales = await POSSales.findAll({
            where: {
                created_at: {
                    [Op.gte]: new Date(from),
                    [Op.lte]: new Date(to)
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
                            where: {
                                category_id: {
                                    [Op.in]: categories  // Filter products by the provided categories
                                }
                            }
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
                    [Op.gte]: new Date(from),
                    [Op.lte]: new Date(to)
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
                                    where: {
                                        category_id: {
                                            [Op.in]: categories  // Filter products by the provided categories
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            attributes: ['sale_return_number', 'sales_number', 'total_refund', 'payment_method']
        });

        // Step 3: Process Sales and Returns

        // Sum total sales amounts
        const totalSalesAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0);

        // Sum total refund amounts
        const totalRefundAmount = returns.reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0);

        // Net sales
        const netSales = totalSalesAmount - totalRefundAmount;

        // Cash sales and returns
        const totalCashSales = sales
            .filter(sale => sale.payment_method === 'cash')
            .reduce((sum, sale) => sum + parseFloat(sale.discounted_total), 0);

        const totalCashReturns = returns
            .filter(ret => ret.payment_method === 'cash')
            .reduce((sum, ret) => sum + parseFloat(ret.total_refund), 0);

        const netCash = totalCashSales - totalCashReturns;

        // Process sold and returned quantities for products
        const productSummary = {};

        // Process sold quantities
        sales.forEach(sale => {
            sale.sale_products.forEach(saleProduct => {
                const productName = saleProduct.product.name;
                if (!productSummary[productName]) {
                    productSummary[productName] = { sold_quantity: 0, returned_quantity: 0 };
                }
                productSummary[productName].sold_quantity += saleProduct.quantity;
            });
        });

        // Process returned quantities
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

        // Step 4: Return the results
        res.status(200).json({
            salesOnly: sales.map(sale => {
                const saleObj = sale.get({ plain: true });
                delete saleObj.sale_products;  // Remove sale products details
                return saleObj;
            }),
            returnsOnly: returns.map(ret => {
                const returnObj = ret.get({ plain: true });
                delete returnObj.return_products;  // Remove return products details
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













module.exports = {adminSalesOverview};

// const adminSalesByCategory = async (req, res) => {
//     try{
        
//     } catch (error) {
//        res.status(500).json({
//         status: false,
//         message: 'error fetching sales',
//         error: error.message
//        })
//     }
// }


// const POSSales = require('../../models/POSSale');  // Adjust the path as needed
// const POSSaleReturn = require('../../models/SaleReturn');
// const POSSaleProducts = require('../../models/POSSaleProduct');
// const SaleReturnProducts = require('../../models/SaleReturnProduct');
// const Products = require('../../models/Product');
// const User = require('../../models/User');  // change it to User... 
// const {Op} = require('sequelize')


// const adminSalesOverview = async (req, res) => {
//     try {
//         const { from, to, categories } = req.query;

//         let categoriesArray;
//         if (typeof categories === 'string') {
//         try {
//             categoriesArray = JSON.parse(categories);
//         } catch (error) {
//             categoriesArray = [categories]; // If parsing fails, fallback to an array with one element
//         }
//         } else {
//         categoriesArray = Array.isArray(categories) ? categories : [categories];
//         }
//         // Convert date strings to Date objects and generate the date range
//         const startDate = new Date(from);
//         const endDate = new Date(to);
//         const dates = [];
//         for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//             dates.push(new Date(d).toISOString().split('T')[0]);
//         }
//         console.log(dates); 

//         // Initialize an object to store data by date
//         const dailyOverview = {};

//         // Loop over each date and fetch sales and returns for that date
//         for (let date of dates) {
//             // Fetch sales for each day
//             const sales = await POSSales.findAll({
//                 where: {
//                     created_at: {
//                         [Op.gte]: new Date(`${date}T00:00:00`),
//                         [Op.lte]: new Date(`${date}T23:59:59`)
//                     },
//                     ...(categoriesArray ? { '$sale_products.product.category_id$': { [Op.in]: categoriesArray } } : {})
//                 },
//                 include: [
//                     {
//                         model: User,
//                         where: { role: '3' },  // salesman
//                         attributes: ['name'],
//                     },
//                     {
//                         model: POSSaleProducts,
//                         as: 'sale_products',
//                         attributes: ['quantity'],
//                         include: [
//                             {
//                                 model: Products,
//                                 as: 'product',
//                                 attributes: ['name', 'category_id']
//                             }
//                         ]
//                     }
//                 ],
//                 attributes: ['sale_number', 'sub_total_amount', 'discount', 'discounted_total', 'payment_method']
//             });

//             // Fetch returns for each day
//             const returns = await POSSaleReturn.findAll({
//                 where: {
//                     created_at: {
//                         [Op.gte]: new Date(`${date}T00:00:00`),
//                         [Op.lte]: new Date(`${date}T23:59:59`)
//                     },
//                     ...(categoriesArray ? { '$return_products.sale_products.product.category_id$': { [Op.in]: categoriesArray } } : {})
//                 },
//                 include: [
//                     {
//                         model: User,
//                         where: { role: '3' }, // Filter by salesperson role
//                         attributes: ['name']
//                     },
//                     {
//                         model: SaleReturnProducts,
//                         as: 'return_products',
//                         attributes: ['quantity'],
//                         include: [
//                             {
//                                 model: POSSaleProducts, // Linking through POSSaleProduct
//                                 as: 'sale_products',
//                                 attributes: [], // No direct attributes from POSSaleProduct needed
//                                 include: [
//                                     {
//                                         model: Products, // Products associated with POSSaleProduct
//                                         as: 'product',
//                                         attributes: ['name', 'category_id']
//                                     }
//                                 ]
//                             }
//                         ]
//                     }
//                 ],
//                 attributes: ['sale_return_number', 'sales_number', 'total_refund', 'payment_method']
//             });
            

//             // Process sales and returns data
//             const dateSummary = {};

//             sales.forEach(sale => {
//                 // console.log("hahahhahahh", sale)
//                 // res.json(sale); 
//                 const salesperson = sale.User.name; // error: name not defined.

//                 // Initialize the salesperson data for the date
//                 if (!dateSummary[salesperson]) {
//                     dateSummary[salesperson] = {
//                         totalSalesAmount: 0,
//                         totalCashSales: 0,
//                         totalCardSales: 0,
//                         sales: []
//                     };
//                 }

//                 const saleTotal = parseFloat(sale.discounted_total);
//                 dateSummary[salesperson].totalSalesAmount += saleTotal;

//                 if (sale.payment_method === 'cash') {
//                     dateSummary[salesperson].totalCashSales += saleTotal;
//                 } else {
//                     dateSummary[salesperson].totalCardSales += saleTotal;
//                 }

//                 dateSummary[salesperson].sales.push({
//                     sale_number: sale.sale_number,
//                     sub_total_amount: sale.sub_total_amount,
//                     discounted_total: sale.discounted_total
//                 });
//             });

//             returns.forEach(ret => {
//                 const salesperson = ret.User.name; // cleared of tentative bugs till this LINE<<<

//                 // Initialize the salesperson data for the date if not already
//                 if (!dateSummary[salesperson]) {
//                     dateSummary[salesperson] = {
//                         totalRefundAmount: 0,
//                         totalCashReturns: 0,
//                         totalCardReturns: 0,
//                         returns: []
//                     };
//                 }

//                 const returnTotal = parseFloat(ret.total_refund);
//                 dateSummary[salesperson].totalRefundAmount = (dateSummary[salesperson].totalRefundAmount || 0) + returnTotal;

//                 if (ret.payment_method === 'cash') {
//                     dateSummary[salesperson].totalCashReturns = (dateSummary[salesperson].totalCashReturns || 0) + returnTotal;
//                 } else {
//                     dateSummary[salesperson].totalCardReturns = (dateSummary[salesperson].totalCardReturns || 0) + returnTotal;
//                 }

//                 dateSummary[salesperson].returns = []
//                 dateSummary[salesperson].returns.push({
//                     sale_return_number: ret.sale_return_number,
//                     total_refund: ret.total_refund
//                 });
//             });

//             // Store the aggregated data for this date
//             dailyOverview[date] = dateSummary;
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Admin sales overview fetched successfully',
//             data: dailyOverview
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: 'Error occurred while fetching admin sales overview',
//             error: error.message
//         });
//     }
// };


// module.exports = {adminSalesOverview}; 