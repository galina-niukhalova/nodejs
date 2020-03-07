const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

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

exports.getAllTours = async (req, resp) => {
  try {
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
  } catch ({ message }) {
    resp.status(404).json({
      status: 'error',
      message,
    });
  }
};

exports.getTour = async (req, resp) => {
  try {
    const tour = await Tour.findById(req.params.id);

    resp.status(200).json({
      status: 'Success',
      data: {
        tour,
      },
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};

exports.updateTour = async (req, resp) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    resp.status(200).json({
      status: 'Success',
      data: {
        tour,
      },
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};

exports.createTour = async (req, resp) => {
  try {
    const tour = await Tour.create(req.body);

    resp.status(200).json({
      status: 'Success',
      data: {
        tour,
      },
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};

exports.deleteTour = async (req, resp) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    resp.status(204).json({
      status: 'Success',
      data: null,
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};


exports.getTourStats = async (req, resp) => {
  console.log('in getTourStats');
  try {
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
  } catch ({ message }) {
    resp.status(404).json({
      status: 'error',
      message,
    });
  }
};


// calc busiest month of the given year
// how many tours start in the beginning of the given month of the given year
exports.getMonthlyPlan = async (req, resp) => {
  try {
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
  } catch ({ message }) {
    resp.status(404).json({
      status: 'error',
      message,
    });
  }
};
