const Product = require('../../models/Product')

const getAllProductsAtPOS = async (req, res) => {
    try {
        
        const products = await Product.findAll({
            where: { status: 'active' },  
            attributes: ['id', 'name', 'quantity', 'price', 'discount', 'barcode']  
        });

        if (!products || products.length === 0) {
            return res.status(404).json({
                success: true,
                message: 'No active products available for sale.'
            });
        }

        let updated_products = products.map((product) => {
            // Convert each product to a plain object and add discountedPrice
            let productData = product.get({ plain: true });
            productData.discountedPrice = productData.price * (1 - productData.discount / 100);
            return productData;
        });

        res.status(200).json({
            success: true,
            message: 'fetching operation successful',
            products: updated_products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
}





module.exports = { getAllProductsAtPOS }