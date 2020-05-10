const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.getMe = (req, resp, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, resp, next) => {
  // 1. Create an error if user post password data
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('This route is not for password updates. Please use /updatePassword', 400));
  }

  // 2. Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  // eslint-disable-next-line no-underscore-dangle
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    // will return a new object
    new: true,
    runValidators: true,
  });

  return resp.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, resp) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  resp.status(204).json({
    status: 'success',
    data: null,
  });
});


exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
