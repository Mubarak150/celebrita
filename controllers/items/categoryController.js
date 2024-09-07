const Category = require('../../models/Category');
const { handleCreate, handleReadAll, handleReadById, handleUpdateById, handleDeleteById } = require('../../utils/functions');

exports.createCategory = handleCreate(Category);
exports.getAllCategories = handleReadAll(Category);
exports.getCategoryById = handleReadById(Category);
exports.updateCategoryById = handleUpdateById(Category);
exports.deleteCategoryById = handleDeleteById(Category);