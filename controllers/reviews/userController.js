const Review = require("../../models/Review");
const { sequelize } = require("../../config/db");
const { Op } = require("sequelize");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");

const createReview = asyncErrorHandler(async (req, res, next) => {
  req.body.user_id = req.user_id;
  await Review.create(req.body);
  res.status(201).json({ status: true, message: "record created" });
});

const getAverageRating = async (product_id) => {
  try {
    const result = await Review.findOne({
      attributes: [
        [sequelize.fn("AVG", sequelize.col("stars")), "averageRating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"],
      ],
      where: {
        product_id,
        [Op.or]: [{ status: "approved" }, { status: "pinned" }],
      },
    });

    // Extract averageRating and reviewCount
    let averageRating = result?.getDataValue("averageRating");
    let reviewCount = result?.getDataValue("reviewCount");

    // Handle default values
    if (!reviewCount) reviewCount = 6;
    if (!averageRating || averageRating < 3.5) averageRating = 3.5;
    averageRating = parseFloat(averageRating).toFixed(1);

    return {
      average: averageRating,
      count: reviewCount,
    };
  } catch (error) {
    console.error("Error fetching average rating:", error);
    throw new Error("Failed to fetch average rating");
  }
};

module.exports = getAverageRating;

module.exports = {
  createReview,
  getAverageRating,
};
