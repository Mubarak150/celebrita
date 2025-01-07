const express = require("express");
const router = express.Router();
const {
  auth,
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

router.get("/", auth, getAllReviews); // done
router.get("/:id", protect, isUserAdmin, getReviewById); // done
// router.get("/status/pending", protect, isUserAdmin, (req, res) =>
//   getReviewsByStatus(req, res, "pending")
// ); // done
// router.get("/status/approved", (req, res) =>
//   getReviewsByStatus(req, res, "approved")
// ); // done
// router.get("/status/pinned", (req, res) =>
//   getReviewsByStatus(req, res, "pinned")
// ); // this route is for home page... so no admin auth and sign in needed.

router.patch("/:id", protect, updateReview);

router.delete("/:id", protect, deleteReview);

module.exports = router;
