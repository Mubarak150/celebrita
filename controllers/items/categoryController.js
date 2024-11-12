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

exports.getAllCategoriesForLandingPage = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { status: 'active' }
        });

        res.status(200).json({
            status: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching active categories:', error);
        res.status(500).json({
            status: false,
            message: 'Server error while fetching categories'
        });
    }
};


exports.getCategoryById = handleReadById(`
    SELECT * FROM categories 
    WHERE id = :id
`);

exports.updateCategoryById = handleUpdateById("categories");

exports.deleteCategoryById = handleDeleteById(`
    DELETE FROM categories 
    WHERE id = :id
`, 'categories');
