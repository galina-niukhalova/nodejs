const factory = require('./handlerFactory');
const Reviews = require('../models/reviewModel');

exports.setTourUserIds = (req, resp, next) => {
  // eslint-disable-next-line no-underscore-dangle
  if (!req.body.user) { req.body.user = req.user._id; }
  if (!req.body.tour) { req.body.tour = req.params.tourId; }

  next();
};

exports.getAllReviews = factory.getAll(Reviews);
exports.createReview = factory.createOne(Reviews);
exports.deleteReview = factory.deleteOne(Reviews);
exports.updateReview = factory.updateOne(Reviews);
exports.getReview = factory.getOne(Reviews);
