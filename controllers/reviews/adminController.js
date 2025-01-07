const User = require("../../models/User");
const Product = require("../../models/Product");
const Review = require("../../models/Review");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { getAll, getOne, update } = require("../../utils/helpers");

// Get Reviews by Status with Pagination
const getAllReviews = asyncErrorHandler(
  async (req, res) =>
    await getAll(req, res, Review, [
      {
        model: User,
        attributes: ["id", "name", "email"],
      },
      {
        model: Product,
        attributes: ["id", "name", "thumbnail"],
      },
    ])
);

const getReviewById = asyncErrorHandler(
  async (req, res) =>
    await getOne(req, res, Review, [
      {
        model: User,
        attributes: ["id", "name", "email"],
      },
      {
        model: Product,
        attributes: ["id", "name", "thumbnail"],
      },
    ])
);
// Get Review by ID
// const getReviewById = async (req, res) => {
//   const { id } = req.params; // The review ID from the request URL

//   try {
//     const review = await Review.findOne({
//       where: { id },
//       include: [
//         {
//           model: User,
//           attributes: ["id", "name", "email"], // Include User details
//         },
//         {
//           model: Product,
//           attributes: ["id", "name", "thumbnail"], // Include Product details
//         },
//       ],
//     });

//     if (!review) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Review not found" });
//     }

//     res.status(200).json({ success: true, data: review });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// Update a Review

const updateReview = update(Review);

// Delete a Review
const deleteReview = async (req, res) => {
  const { id } = req.params; // Review ID

  try {
    const reviewInstance = await Review.findByPk(id);

    if (!reviewInstance) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    }

    await reviewInstance.destroy();

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
