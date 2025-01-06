const express = require("express");
const router = express.Router();
const { auth, validate } = require("../../middleware/auth");
const { createReview } = require("../../controllers/reviews/userController");
const {
  createReviewSchema,
  updateReviewSchema,
} = require("../../utils/validators");

// Route for users to add reviews
router.post("/", auth, validate(createReviewSchema), createReview);

module.exports = router;
