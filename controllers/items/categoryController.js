const Category = require('../../models/Category');
const { QueryTypes } = require('sequelize');
const { handleCreate, handleReadAll, handleReadById, handleUpdateById, handleDeleteById } = require('../../utils/functions');

exports.createCategory = handleCreate(`
    INSERT INTO categories (category, description, d_url) 
    VALUES (:category, :description, :d_url)
`);

exports.getAllCategories = handleReadAll(`
    SELECT * FROM categories 
    LIMIT :limit OFFSET :offset
`, 'categories');

exports.getAllCategoriesForLandingPage = handleReadAll(`
    SELECT * FROM categories 
    where status = 'active'
    LIMIT :limit OFFSET :offset
`, 'categories');

exports.getCategoryById = handleReadById(`
    SELECT * FROM categories 
    WHERE id = :id
`);

exports.updateCategoryById = handleUpdateById("categories");

exports.deleteCategoryById = handleDeleteById(`
    DELETE FROM categories 
    WHERE id = :id
`, 'categories');
