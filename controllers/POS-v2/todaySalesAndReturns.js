const POSSales = require('../../models/POSSale')
const POSSaleReturn = require('../../models/SaleReturn'); 
const {Op} = require('sequelize')

const todaySalesAndReturns = async (req, res) => {
    try {
        const date = new Date().toISOString().split('T')[0];
        console.log("date:", date);

        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        const sales = await POSSales.findAll({
            where: {
                user_id: req.body.user.id,
                created_at: {
                    [Op.gte]: startOfDay, // start of the day
                    [Op.lte]: endOfDay    // end of the day
                }
            },
            attributes: ['sale_number', 'sub_total_amount', 'discount', 'discounted_total', 'payment_method']
        });

        const returns = await POSSaleReturn.findAll({
            where: {
                user_id: req.body.user.id,
                created_at: {
                    [Op.gte]: startOfDay, // start of the day
                    [Op.lte]: endOfDay    // end of the day
                }
            },
            attributes: ['sale_return_number', 'sales_number', 'total_refund', 'payment_method']
        });

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

        res.status(200).json({
            sales,
            returns,
            totalSalesAmount,
            totalRefundAmount,
            netSales,
            totalCashSales,
            totalCashReturns,
            netCash
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