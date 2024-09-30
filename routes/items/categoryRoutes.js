const express = require('express');
const router = express.Router();
// const {protect, checkSignIn} = require('../middleware/auth');
const {
  createCategory,
  getAllCategories,
  getAllCategoriesForLandingPage,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
} = require('../../controllers/items/categoryController');

router.post('/', createCategory);
router.get('/', getAllCategories); 
router.get('/all/active', getAllCategoriesForLandingPage); 
router.get('/:id', getCategoryById);
router.patch('/:id', updateCategoryById);
router.delete('/:id', deleteCategoryById);

module.exports = router;