const express = require("express");
const router = express.Router();
const {
  addCategorySchema,
  updateCategorySchema,
} = require("../../utils/validators");
const { auth, validate, allow } = require("../../middleware/auth");
const {
  addCategory,
  getCategoryById,
  getAllCategories,
  updateCategoryById,
  deleteCategoryById,
} = require("../../controllers/items/categoryController");

router.post(
  "/",
  auth,
  allow("1", "6"),
  validate(addCategorySchema),
  addCategory
); //

router.get("/", getAllCategories);

router.get("/:id", getCategoryById);

router.patch(
  "/:id",
  auth,
  allow("1", "6"),
  validate(updateCategorySchema),
  updateCategoryById
);

router.delete(
  "/:id",
  auth,
  allow("1", "6"),
  auth,
  allow("1", "6"),
  deleteCategoryById
);

module.exports = router;
