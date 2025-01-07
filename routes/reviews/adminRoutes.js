const express = require("express");
const router = express.Router();
const {
  auth,
  allow,
  validate,
  isUserAdmin,
  protect,
} = require("../../middleware/auth");
const { createReview } = require("../../controllers/reviews/userController");
const {
  getAllReviews,
  //   getReviewsByStatus,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../../controllers/reviews/adminController");
const {
  createReviewSchema,
  updateReviewSchema,
} = require("../../utils/validators");

router.get("/", auth, getAllReviews);

router.get("/:id", auth, allow("1"), getReviewById);

router.patch(
  "/:id",
  auth,
  allow("1"),
  validate(updateReviewSchema),
  updateReview
);

router.delete("/:id", auth, allow("1"), deleteReview);

module.exports = router;
