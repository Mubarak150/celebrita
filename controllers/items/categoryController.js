const Category = require("../../models/Category");
const {
  handleCreate,
  handleReadAll,
  handleReadById,
  handleUpdateById,
  handleDeleteById,
} = require("../../utils/functions");
const { CustomError, makeError } = require("../../utils/CustomError");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const {
  sendSuccess,
  getAll,
  getOne,
  update,
  create,
} = require("../../utils/helpers");

// 1. Add a new society
const addCategory = create(Category);

// 2.
const getCategoryById = asyncErrorHandler(
  async (req, res) => await getOne(req, res, Category, [])
);

// 3.
const getAllCategories = asyncErrorHandler(
  async (req, res) => await getAll(req, res, Category, [])
); // bahut dimagh kharch huwa es ko krtay krtay.. hahh

// 4.
const updateCategoryById = update(Category);

// 5.
const deleteCategoryById = handleDeleteById(
  `
    DELETE FROM categories 
    WHERE id = :id
`,
  "categories"
);

module.exports = {
  addCategory,
  getCategoryById,
  getAllCategories, //
  updateCategoryById,
  deleteCategoryById,
};
