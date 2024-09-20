const express = require('express');
const router = express.Router();
const {protect, isUserAdmin} = require('../../middleware/auth');
const { getReviewsByStatus, getReviewById, updateReview, deleteReview } = require('../../controllers/reviews/adminController');

router.get('/:id',  protect, isUserAdmin, getReviewById ); // done
router.get('/status/pending',  protect, isUserAdmin, (req, res) => getReviewsByStatus(req, res, 'pending')); // done
router.get('/status/approved',  protect, isUserAdmin, (req, res) => getReviewsByStatus(req, res, 'approved')); // done
router.get('/status/pinned',  protect, isUserAdmin, (req, res) => getReviewsByStatus(req, res, 'pinned')); // done

router.patch('/:id', protect, updateReview );

router.delete('/:id', protect, deleteReview );

module.exports = router;