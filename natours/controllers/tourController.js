const multer = require('multer');
const sharp = require('sharp');
const factory = require('./handlerFactory');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const multerStorage = multer.memoryStorage();

// test if file is an image
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(new AppError('Not an image! Please upload only images', 400), false);
  }
};

// Multer is a node.js middleware for handling multipart/form-data,
// which is primarily used for uploading files.
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, resp, next) => {
  const { images, imageCover } = req.files;

  if (!imageCover || !images) {
    next();
  }

  // Image cover
  req.body.imageCover = `tour-${req.params.id}-${Date.now}-cover.jpeg`;
  await sharp(imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`natours/public/img/tours/${req.body.imageCover}`);

  // Images
  req.body.images = [];
  await Promise.all(
    images.map(async (image, index) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`natours/public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    }),
  );

  // console.log(req.body.images);
  next();
});

// when upload multiple images with the same name
// upload.array('images', 3) -> 3 is maxCount

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

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);


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

exports.getToursWithin = catchAsync(async (req, resp, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latititr and longitude in the format lat, lng.',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  resp.status(200).json({
    status: 'Success',
    data: tours,
  });
});
