const User = require('../../models/User');
const Product = require('../../models/Product');
const Review = require('../../models/Review');

// Get Reviews by Status with Pagination
const getReviewsByStatus = async (req, res, status) => {
  const { page = 1, limit = 10 } = req.query;  // Default pagination values
  const limitValue = parseInt(limit, 10);
  const offset = (parseInt(page, 10) - 1) * limitValue;

  try {
    // Fetch reviews by status with pagination
    const reviews = await Review.findAndCountAll({
      where: { status },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']  // Include User details
        },
        {
          model: Product,
          attributes: ['id', 'name', 'thumbnail']  // Include Product details
        }
      ],
      limit: limitValue,  // Limit the number of results per page
      offset: offset      // Skip records for pagination
    });

    // If no reviews found, return 404
    if (!reviews.rows.length) {
      return res.status(404).json({ success: false, message: 'No reviews found with the given status' });
    }

    // Pagination metadata
    const totalReviews = reviews.count;
    const totalPages = Math.ceil(totalReviews / limitValue);
    const currentPage = parseInt(page, 10);

    // Send the response with paginated reviews and pagination details
    res.status(200).json({
      success: true,
      pagination: {
        totalReviews,
        totalPages,
        currentPage,
        limit: limitValue
      },
      data: reviews.rows
      
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Get Review by ID
const getReviewById = async (req, res) => {
    const { id } = req.params; // The review ID from the request URL
  
    try {
      const review = await Review.findOne({
        where: { id },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']  // Include User details
          },
          {
            model: Product,
            attributes: ['id', 'name', 'thumbnail']  // Include Product details
          }
        ]
      });
  
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
  
      res.status(200).json({ success: true, data: review });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

// Update a Review
const updateReview = async (req, res) => {
    const { id } = req.params; // Review ID
    const { review, stars, status } = req.body; // Fields that can be updated
  
    // Validate the stars value
    if (stars && (stars < 1 || stars > 5)) {
      return res.status(400).json({ success: false, message: 'Stars rating must be between 1 and 5.' });
    }
  
    try {
      const reviewInstance = await Review.findByPk(id);
  
      if (!reviewInstance) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
  
      // Update the review fields, if matches record:
      if (review) reviewInstance.review = review;
      if (stars) reviewInstance.stars = stars;
      if (status) reviewInstance.status = status;
  
      await reviewInstance.save();
  
      res.status(200).json({ success: true, message: 'Review updated successfully.', data: reviewInstance });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

// Delete a Review
const deleteReview = async (req, res) => {
    const { id } = req.params; // Review ID
  
    try {
      const reviewInstance = await Review.findByPk(id);
  
      if (!reviewInstance) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
  
      await reviewInstance.destroy();
  
      res.status(200).json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
  
  
  

  module.exports = {
    getReviewsByStatus,
    getReviewById,
    updateReview,
    deleteReview
  };
  