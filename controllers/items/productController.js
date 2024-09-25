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

// Helper function to convert kebab-case to capitalized words
const kebabToCapitalized = (str) => {
    return str
        .split('-') // Split by dashes
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' '); // Join them back with spaces
};

// Function to get all products by category name (in kebab-case)
exports.getAllProductsByCategoryName = async (req, res) => {
    try {
        const { category } = req.params;

        // Convert the kebab-case category name to capitalized words
        const formattedCategory = kebabToCapitalized(category);

        // Step 1: Find the category by name
        const foundCategory = await Category.findOne({
            where: { category: formattedCategory }
        });

        // If no category found, return an error
        if (!foundCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Step 2: Get all products that have the matching category_id
        const products = await Product.findAll({
            where: { category_id: foundCategory.id }
        });

        // If no products found, return a 404
        if (!products.length) {
            return res.status(404).json({ success: false, message: 'No products found for this category' });
        }

        // Step 3: Parse the images field for each product
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

        // Step 4: Send the modified products in the response
        res.status(200).json({ success: true, data: productsWithParsedImages });
    } catch (error) {
        // Handle any other errors
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.getProductById = async (req, res) => {
    try {
        const { product } = req.params;

        // Convert the kebab-case category name to capitalized words
        const formattedProduct = kebabToCapitalized(product);

        // Step 1: Find the category by name
        const foundProduct = await Product.findOne({
            where: { name: formattedProduct }
        });

        // If no category found, return an error
        if (!foundProduct) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Step 3: Parse the images field for each product
       
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

        // Step 4: Send the modified products in the response
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
