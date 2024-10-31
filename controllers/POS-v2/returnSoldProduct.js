const Product = require('../../models/Product'); 
const POSSale = require('../../models/POSSale'); 
const POSSaleProduct = require('../../models/POSSaleProduct'); 

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
const updateSaleAndMakeReturn = async(req, res) => {
    try {

    } catch (error) {
        res.status(500).json({
            status: true, 
            message: 'an error occured while making return',
            error: error.message // i have to remove it for production.
        })
    }
}

module.exports = { getSaleBySSN, }