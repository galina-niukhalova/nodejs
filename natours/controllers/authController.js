const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (userId) => jwt.sign(
  { id: userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN },
);

/**
 * SIGNUP
 */
exports.signup = catchAsync(async (req, resp) => {
  /**
   * We should specify what exactly data we want to pass to a new object
   * We should be careful with that and don't pass to create any sensitive
   * information (as ex. user role)
   */
  const {
    name, email, password, passwordConfirm, passwordChangedAt,
  } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  });

  // eslint-disable-next-line no-underscore-dangle
  const token = signToken(newUser._id);

  resp.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});


/**
 * LOGIN
 */
exports.login = catchAsync(async (req, resp, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  /**
   * If field is `select: false`, `findOne` will not return it by default
   * To query such fields, we need to specify .select('+[field_name]')
   */
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401 - unauthorized
    return next(new AppError('Incorrect email or password', 401));
  }

  // eslint-disable-next-line no-underscore-dangle
  const token = signToken(user._id);
  resp.status(200).json({
    status: 'success',
    token,
  });

  return next();
});


/**
 * Protect
 */
exports.protect = catchAsync(async (req, resp, next) => {
  // *******************************
  // 1. GET a token from HTTP header
  // *******************************
  const { authorization } = req.headers;
  let token;

  if (authorization && authorization.startsWith('Bearer')) {
    [, token] = authorization.split(' ');
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401),
    );
  }

  // *******************************
  // 2. Verification token
  // *******************************
  // jwt.verify(token, secret, callback)
  // with promisify: promisify(jwt.verify)(token, secret) = Promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // ********************************
  // 3. Check if user is still exists
  // ********************************
  const { id: userId, iat } = decoded;
  const currentUser = await User.findById(userId);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token does not longer exist', 401),
    );
  }

  // ********************************
  // Check if user changed password after the token was issued
  // ********************************
  if (currentUser.changedPasswordAfter(iat)) {
    return next(
      new AppError('User recently changed password! Please login again'), 401,
    );
  }

  // Grand access to a protected route
  req.user = currentUser;
  return next();
});
