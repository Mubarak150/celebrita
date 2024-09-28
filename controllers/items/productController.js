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
    WHERE products.status = 'active'
    LIMIT :limit OFFSET :offset;

`, 'products');


// Function to get all products by category name (in kebab-case)
exports.getAllProductsByCategoryName = async (req, res) => {
    try {
        const { category } = req.params;  // The category name in kebab-case from the request (e.g., 'electronics-accessories')

        // Step 1: Retrieve all categories from the database
        const categories = await Category.findAll();

        // Step 2: Convert each category's name to kebab-case and check for a match
        const foundCategory = categories.find(cat => toKebabCase(cat.category) === category);

        // If no category found, return an error
        if (!foundCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Step 3: Get all products that have the matching category_id
        const products = await Product.findAll({
            where: { category_id: foundCategory.id }
        });

        // If no products found, return a 404
        if (!products.length) {
            return res.status(404).json({ success: false, message: 'No products found for this category' });
        }



        // Step 4: Parse the images field for each product and prepare the response
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

        // Step 5: Send the products along with the original category name in the response
        res.status(200).json({ 
            success: true, 
            data: {
                category: foundCategory.category,  // Send the original category name
                products: productsWithParsedImages // Send the products with parsed images
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

        // Step 3: Parse the images field for the product if it exists
        if (foundProduct.images) {
            try {
                // Attempt to parse the stringified JSON into an array
                foundProduct.images = JSON.parse(foundProduct.images);

                // Ensure that it's an array after parsing
                if (!Array.isArray(foundProduct.images)) {
                    throw new Error('Images field is not an array');
                }
            } catch (error) {
                console.error('Error parsing images field for foundProduct:', foundProduct.id, error.message);
                foundProduct.images = []; // Fallback to an empty array if parsing fails
            }
        }

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
