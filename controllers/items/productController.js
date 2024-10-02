const Product = require('../../models/Product');
const Category = require('../../models/Category');
const { QueryTypes } = require('sequelize');
const { handleCreate, handleReadAll, handleReadById, handleUpdateById, handleDeleteById } = require('../../utils/functions');

exports.createProduct = handleCreate(`
    INSERT INTO products (name, description, price, discount, quantity, thumbnail, status, images, category_id)
    VALUES (:name, :description, :price, :discount, :quantity, :thumbnail, :status, :images, :category_id);
`);

exports.getAllProducts = handleReadAll(`
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
    LIMIT :limit OFFSET :offset;

`, 'products');

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


exports.updateProductById = handleUpdateById("products");

exports.deleteProductById = handleDeleteById(`
    DELETE FROM products 
    WHERE id = :id
`, 'products');
