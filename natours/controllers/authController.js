const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (userId) => jwt.sign(
  { id: userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN },
);

const createAndSentToken = (user, statusCode, resp) => {
  // eslint-disable-next-line no-underscore-dangle
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now()
    + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // cookie can't be modified by the browser (only read and sent back)
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    // only with https connection
    cookieOptions.secure = true;
  }

  resp.cookie('jwt', token, cookieOptions);

  // to remove password from the response
  // eslint-disable-next-line no-param-reassign
  user.password = undefined;

  resp.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

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
    name, email, role, password, passwordConfirm, passwordChangedAt,
  } = req.body;
  const newUser = await User.create({
    name,
    email,
    role,
    password,
    passwordConfirm,
    passwordChangedAt,
  });

  createAndSentToken(newUser, 201, resp);
});


/**
 * LOGIN
 */
// eslint-disable-next-line consistent-return
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

  createAndSentToken(user, 200, resp);
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


exports.restrictTo = (...roles) => (req, resp, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permissions to perform this action', 403));
  }

  return next();
};


/**
 * Forgot password
 */
exports.forgotPassword = catchAsync(async (req, resp, next) => {
  // 1. Get user by email
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2. Generate a reset password token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Sent the token to the user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    return resp.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});


/**
 * Reset password
 */
// eslint-disable-next-line consistent-return
exports.resetPassword = catchAsync(async (req, resp, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt property for the user
  // Happens in pre.save middleware

  // 4. Log the user in, send JWT
  createAndSentToken(user, 200, resp);
});


/**
 * Update password
 */
// eslint-disable-next-line consistent-return
exports.updatePassword = catchAsync(async (req, resp, next) => {
  // 1. Get user from collection
  const { _id: userId } = req.user;

  const user = await User.findById(userId).select('+password');

  // 2. Check if Posted password is correct
  const { currentPassword, password, passwordConfirm } = req.body;
  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('User password is not correct', 401));
  }

  // 3. If so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4. Log user in, send JWT
  createAndSentToken(user, 200, resp);
});
