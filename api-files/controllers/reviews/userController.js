const Review = require('../../models/Review');
const Order = require('../../models/Order');

// Create a review
const createReview = async (req, res) => {
    const { product_id, review, stars } = req.body;
    const user_id = req.body.user_id;

    // Basic validation for review and stars
    if (!review || stars < 1 || stars > 5) {
        return res.status(400).json({ success: false, message: 'Review cannot be empty and stars must be between 1 and 5.' });
    }

    try {
        // Create the review
        const newReview = await Review.create({
            user_id,
            product_id,
            review,
            stars,
            status: 'pending'  // Default status
        });

        // Return success response
        return res.status(201).json({ success: true, data: newReview });
    } catch (error) {
        // Error handling
        return res.status(500).json({ success: false, message: 'Failed to create review. Please try again later.' });
    }
};


// View review by ID : this function is discarded temporarily...
// const getReviewById = async (req, res) => {
//     const { id } = req.params;

//     try {
//         const review = await Review.findByPk(id);

//         if (!review) {
//             return res.status(404).json({ success: false, message: 'Review not found.' });
//         }

//         res.status(200).json({ success: true, data: review });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

module.exports = {
    createReview,
    // getReviewById
};
