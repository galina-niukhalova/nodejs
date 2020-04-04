const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getUsers = catchAsync(async (req, resp) => {
  const users = await User.find();

  resp.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = (req, resp) => {
  resp
    .status(500)
    .message('Route is not defined');
};

exports.updateUser = (req, resp) => {
  resp
    .status(500)
    .message('Route is not defined');
};

exports.deleteUser = (req, resp) => {
  resp
    .status(500)
    .message('Route is not defined');
};
