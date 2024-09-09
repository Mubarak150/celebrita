const Product = require('../../models/Product');
const { QueryTypes } = require('sequelize');
const { handleCreate, handleReadAll, handleReadById, handleUpdateById, handleDeleteById } = require('../../utils/functions');

exports.createProduct = handleCreate(`
    INSERT INTO products (name, description, price, discount, quantity, thumbnail, images, category_id)
    VALUES (:name, :description, :price, :discount, :quantity, :thumbnail, :images, :category_id);
`);

exports.getAllProducts = handleReadAll(`
    SELECT * FROM products 
    LIMIT :limit OFFSET :offset
`, 'products');

exports.getProductById = handleReadById(`
    SELECT products.*, categories.category 
    FROM products 
    JOIN categories 
    ON products.category_id = categories.id
    WHERE products.id = :id;
`);

exports.updateProductById = handleUpdateById("products");

exports.deleteProductById = handleDeleteById(`
    DELETE FROM products 
    WHERE id = :id
`, 'products');
