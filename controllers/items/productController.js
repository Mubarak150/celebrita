const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Settings = require('../../models/Settings')
const { QueryTypes } = require('sequelize');
const { handleCreate, handleReadAll, handleReadById, handleUpdateById, handleDeleteById } = require('../../utils/functions');
const {Op} = require('sequelize'); 

exports.createProduct = handleCreate(`
    INSERT INTO products (name, description, company_name, manufacturing_date, expiry_date, wholesale_price, price, discount, quantity, thumbnail, status, images, category_id, barcode, supplier)
    VALUES (:name, :description, :company_name, :manufacturing_date, :expiry_date, :wholesale_price, :price, :discount, :quantity, :thumbnail, :status, :images, :category_id, :barcode, :supplier);
`);

exports.getAllProducts = async (req, res) => {
    try {
        
        const products = await Product.findAll({
            include: [
                {
                    model: Category,
                    attributes: ['category'], 
                }
            ]
        });

        if (!products || products.length === 0) {
            return res.status(404).json({
                success: true,
                message: 'No products available.'
            });
        }

        const updated_products = products.map((product) => ({
            name: product.name,
            quantity: product.quantity,
            status: product.status,
            price: product.price,
            discounted_price: product.price - (product.price * (product.discount / 100)),
            retail_price: product.wholesale_price,
            category: product.Category ? product.Category.category : null,
            supplier: product.supplier,
        }));

        res.status(200).json({
            success: true,
            message: 'fetching operation successful',
            data: updated_products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
}

exports.getLowStockProducts = async (req, res) => {
    try {
        // Fetch the quantity threshold from Settings
        const thresholdSetting = await Settings.findOne({ where: { key: "quantityThreshold" } });
      
        if (!thresholdSetting) {
            return res.status(404).json({ status: false, message: "Threshold not set" });
        }
  
        const threshold = parseInt(thresholdSetting.value, 10);
  
        // Find products with quantities less than or equal to the threshold
        const products = await Product.findAll({
            where: { quantity: { [Op.lte]: threshold } },
            include: [
                {
                    model: Category,
                    attributes: ['category'], 
                }
            ]
        });

        // Map over products to construct `lowStockProducts` array
        const lowStockProducts = products.map((product) => ({
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            discounted_price: product.price - (product.price * (product.discount / 100)),
            company_name: product.company_name,
            category: product.Category ? product.Category.category : null // Ensure category exists
        }));
  
        res.status(200).json({ status: true, threshold, lowStockProducts });
    } catch (error) {
        console.error("Error fetching low stock products:", error);
        res.status(500).json({ status: false, message: "Failed to retrieve products" });
    }
};

  

exports.getAllProductsForLandingPage = handleReadAll(`
    SELECT 
        products.name, 
        products.thumbnail, 
        products.id, 
        products.price, 
        products.quantity, 
        products.returned_quantity, 
        products.discount, 
        products.status, 
        categories.category 
    FROM products 
    JOIN categories 
    ON products.category_id = categories.id
    WHERE products.status = 'active'
    LIMIT :limit OFFSET :offset;

`, 'products');


// Function to get all products by category name (in kebab-case) with pagination
exports.getAllProductsByCategoryName = async (req, res) => {
    try {
        const { category } = req.params;  // The category name in kebab-case from the request (e.g., 'electronics-accessories')
        const { page = 1, limit = 10 } = req.query;  // Get page and limit from query params with default values

        const limitValue = parseInt(limit, 10);  // Convert limit to a number
        const offset = (parseInt(page, 10) - 1) * limitValue;  // Calculate the offset for the query

        // Step 1: Retrieve all categories from the database
        const categories = await Category.findAll();

        // Step 2: Convert each category's name to kebab-case and check for a match
        const foundCategory = categories.find(cat => toKebabCase(cat.category) === category);

        // If no category found, return an error
        if (!foundCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Step 3: Get the total count of products in this category for pagination
        const totalProducts = await Product.count({
            where: { category_id: foundCategory.id }
        });

        // Step 4: Get paginated products that have the matching category_id
        const products = await Product.findAll({
            where: { category_id: foundCategory.id },
            limit: limitValue,  // Limit the number of products returned
            offset: offset      // Skip the first (page - 1) * limit products
        });

        // If no products found, return a 404
        if (!products.length) {
            return res.status(404).json({ success: false, message: 'No products found for this category' });
        }

        // Step 5: Parse the images field for each product and prepare the response
        const productsWithParsedImages = products.map(product => {
            if (product.images) {
                try {
                    // Attempt to parse the stringified JSON into an array
                    product.images = JSON.parse(product.images);

                    // Ensure that it's an array after parsing
                    if (!Array.isArray(product.images)) {
                        throw new Error('Images field is not an array');
                    }
                } catch (error) {
                    console.error('Error parsing images field for product:', product.id, error.message);
                    product.images = []; // Fallback to an empty array if parsing fails
                }
            }

            return product;
        });

        // Step 6: Calculate pagination details
        const totalPages = Math.ceil(totalProducts / limitValue);  // Total pages based on product count and limit
        const currentPage = parseInt(page, 10);

        // Step 7: Send the products along with pagination metadata
        res.status(200).json({
            success: true,
            data: {
                category: foundCategory.category,  // Send the original category name
                products: productsWithParsedImages,  // Send the products with parsed images
                pagination: {
                    totalProducts,  // Total number of products in the category
                    totalPages,  // Total number of pages
                    currentPage,  // Current page
                    limit: limitValue  // Products per page (limit)
                }
            }
        });
    } catch (error) {
        // Handle any other errors
        res.status(500).json({ success: false, error: error.message });
    }
};


// Utility function to convert a string to kebab-case
const toKebabCase = (str) => {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace spaces and symbols with hyphens
        .replace(/^-+|-+$/g, '');     // Remove leading or trailing hyphens
};

exports.getProductById = async (req, res) => {
    try {
        const { product } = req.params;  // The product name in kebab case from the request (e.g., 'panadol-ibrufen')

        // Step 1: Retrieve all products from the database
        const products = await Product.findAll();

        // Step 2: Convert each product's name to kebab-case and check for a match
        const foundProduct = products.find(prod => toKebabCase(prod.name) === product);

        // If no product is found, return an error
        if (!foundProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const category = await Category.findOne({
            where: { id: foundProduct.category_id }
        });
        
        if (category) {
            foundProduct.setDataValue('category', category.category);
        }        

        if (typeof foundProduct.images === 'string') {
            try {
                foundProduct.images = JSON.parse(foundProduct.images);
            } catch (error) {
                console.error('Error parsing images field:', foundProduct.id, error.message);
                foundProduct.images = []; // Fallback to an empty array
            }
        }
        // console.log(typeof foundProduct.images); 

        // Step 4: Send the original product details (including the original name from the database)
        res.status(200).json({ success: true, data: foundProduct });
    } catch (error) {
        // Handle any other errors
        res.status(500).json({ success: false, error: error.message });
    }
}; 


// search product by name or partial name:
exports.searchProductByName = async (req, res) => {
    try {
        const { name } = req.query;  // The search term from the request (e.g., 'panadol')

        // Step 1: Query the database to find products where the name matches or contains the search term
        const products = await Product.findAll({
            where: {
                name: {
                    [Op.like]: `%${name}%`  // Use LIKE operator to find partial matches
                }
            },
            attributes: ['name']  // Only select the 'name' field
        });

        // Step 2: Check if any products were found
        if (!products.length) {
            return res.status(404).json({ success: false, message: 'No matching products found' });
        }

        // Step 3: Extract only the product names into an array
        const productNames = products.map(prod => prod.name);

        // Step 4: Send the product names as an array
        res.status(200).json({ success: true, data: productNames });
    } catch (error) {
        // Handle any errors
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.updateProductById = handleUpdateById("products");

exports.deleteProductById = handleDeleteById(`
    DELETE FROM products 
    WHERE id = :id
`, 'products');


exports.getProductsWithValuation = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'quantity', 'wholesale_price']  
        });

        if (!products || products.length === 0) {
            return res.status(404).json({
                success: true,
                message: 'No active products available for sale.'
            });
        }

        // Initialize total valuation
        let totalValuation = 0;

        // Process products to add `discountedPrice` and `totalPrice`
        let updated_products = products.map((product) => {
            // Convert each product to a plain object
            let productData = product.get({ plain: true });


            // Calculate total price (discounted price * quantity)
            productData.totalPrice = productData.wholesale_price * productData.quantity;

            // Accumulate total valuation
            totalValuation += productData.totalPrice;

            return productData;
        });

        res.status(200).json({
            success: true,
            message: 'Fetching operation successful',
            products: updated_products,
            totalValuation: totalValuation.toFixed(2) // Round to 2 decimal places
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};
