const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.aliasTopTours = (req, resp, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.checkBody = (req, resp, next) => {
  const { name, price } = req.body;

  if (!name || !price) {
    resp.status(404).json({
      status: 'Error',
      message: 'Name and pricing fields are required',
    });
  }

  next();
};

exports.getAllTours = catchAsync(async (req, resp) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sorting()
    .limiting()
    .pagination();

  const tours = await features.query;

  resp.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, resp, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    // eslint-disable-next-line no-new
    return next(new AppError(`No tour found with the id ${req.params.id}`, 404));
  }

  resp.status(200).json({
    status: 'Success',
    data: {
      tour,
    },
  });

  return null;
});

exports.updateTour = catchAsync(async (req, resp, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    /** will check model validation */
    runValidators: true,
  });

  if (!tour) {
    // eslint-disable-next-line no-new
    return next(new AppError(`No tour found with the id ${req.params.id}`, 404));
  }

  resp.status(200).json({
    status: 'Success',
    data: {
      tour,
    },
  });

  return null;
});

exports.createTour = catchAsync(async (req, resp) => {
  const tour = await Tour.create(req.body);

  resp.status(200).json({
    status: 'Success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, resp, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  console.log(tour);

  if (!tour) {
    // eslint-disable-next-line no-new
    return next(new AppError(`No tour found with the id ${req.params.id}`, 404));
  }

  resp.status(204).json({
    status: 'Success',
    data: null,
  });

  return null;
});


exports.getTourStats = catchAsync(async (req, resp) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        // _id: null, // no groups
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, // $avg operator will calc average from all ratings
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgRating: 1,
      },
    },
    // {
    //   $match: {
    //     // _id is difficulty
    //     _id: { $ne: 'easy' }, // not equal
    //   },
    // },
  ]);

  resp.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});


// calc busiest month of the given year
// how many tours start in the beginning of the given month of the given year
exports.getMonthlyPlan = catchAsync(async (req, resp) => {
  const year = req.params.year * 1; // *1 to get a number

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: {
          $push: '$name', // to make an array
        },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0, // remove _id field
      },
    },
    { $sort: { numTours: -1 } },
    { $limit: 12 },
  ]);

  resp.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});
