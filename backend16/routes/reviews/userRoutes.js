const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { createReview, getReviewById } = require('../../controllers/reviews/userController');

// Route for users to add reviews
router.post('/', protect, createReview);

// Route for users to view review by ID
// router.get('/reviews/:id', protect, getReviewById);

module.exports = router;
