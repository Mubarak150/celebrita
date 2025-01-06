const Review = require("../../models/Review");
const Order = require("../../models/Order");
const { create } = require("../../utils/helpers");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");

// Create a review
const createReview = asyncErrorHandler(async (req, res, next) => {
  req.body.user_id = req.user_id;
  await create(Review)(req, res, next);
});

module.exports = {
  createReview,
};
