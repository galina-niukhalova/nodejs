const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review can\'t be empty'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user'],
  },
}, {
  // will allow virtual properties to show up in a query result
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// User can left only one review for specific tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this - is a current Model
  const stats = await this.aggregate([
    [
      {
        $match: { tour: tourId },
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avrRating: { $avg: '$rating' },
        },
      },
    ],
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avrRating,
  });
};

reviewSchema.post('save', function () {
  // this - current document
  // this.constructor - current model
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndDelete
// findByIdAndUpdate
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.document = await this.findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.document.constructor.calcAverageRatings(this.document.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
