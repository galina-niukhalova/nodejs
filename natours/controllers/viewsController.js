const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

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


  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  return resp.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, resp) => {
  resp.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, resp) => {
  resp.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, resp) => {
  // eslint-disable-next-line no-underscore-dangle
  const updatedUser = await User.findByIdAndUpdate(req.user._id, {
    name: req.body.name,
    email: req.body.email,
  }, {
    new: true,
    runValidators: true,
  });

  resp.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

exports.getMyTours = catchAsync(async (req, resp) => {
  // 1. Find all bookings
  const bookings = await Booking.find({
    user: req.user.id,
  });

  // 2. Find tours with the returned Ids
  const tourIds = bookings.map((el) => el.tour.id);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  resp.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});
