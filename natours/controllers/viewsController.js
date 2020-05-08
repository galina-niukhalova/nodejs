const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

// eslint-disable-next-line no-unused-vars
exports.getOverview = catchAsync(async (req, resp, next) => {
  const tours = await Tour.find();

  resp.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

// eslint-disable-next-line no-unused-vars
exports.getTour = catchAsync(async (req, resp, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({ path: 'reviews', fields: 'review rating user' });

  resp.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, resp) => {
  resp.status(200).render('login', {
    title: 'Log into your account',
  });
});
