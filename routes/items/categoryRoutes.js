const express = require('express');
const router = express.Router();
const {addCategorySchema, updateCategorySchema} = require('../../utils/validators')
const {protect, validate, allow} = require('../../middleware/auth');
const {
  addCategory,
  getCategoryById,
  getAllCategories, 
  updateCategoryById,
  deleteCategoryById
} = require('../../controllers/items/categoryController');

router.post('/',  validate(addCategorySchema), addCategory); // protect, allow('1'),
router.get('/',  getAllCategories); 
router.get('/:id', getCategoryById);
router.patch('/:id', validate(updateCategorySchema), updateCategoryById);
router.delete('/:id', deleteCategoryById);

module.exports = router;