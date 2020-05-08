const AppError = require('../utils/appError');

const sentErrorDev = (req, resp, err) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return resp.status(err.statusCode)
      .json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
      });
  }

  // RENDER WEBSITE
  return resp.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sentErrorProd = (req, resp, err) => {
  // API
  // Operation errors, which we created by appError
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return resp.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Unknown system error
    console.error('Error 💥', err);
    return resp.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }

  // RENDER WEBSITE
  if (err.isOperational) {
    return resp.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }

  // Unknown system error
  console.error('Error 💥', err);
  return resp.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 500);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value ${value}, please use another value`;

  return new AppError(message, 500);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;

  return new AppError(message, 500);
};

const handleJWTError = () => new AppError('Invalid token, please login again', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired, please login again', 401);

module.exports = (err, req, resp, next) => {
  let error = Object.assign(err);

  // 500 - internal server error
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sentErrorDev(req, resp, error);
  } else if (process.env.NODE_ENV === 'production') {
    // Mongodb errors
    if (error.name === 'CastError') { error = handleCastErrorDB(error); }
    if (error.code === 11000) { error = handleDuplicateFieldsDB(error); }
    if (error.name === 'ValidationError') { error = handleValidationErrorDB(error); }
    if (error.name === 'JsonWebTokenError') { error = handleJWTError(); }
    if (error.name === 'TokenExpiredError') { error = handleJWTExpiredError(); }

    sentErrorProd(req, resp, error);
  }

  next();
};
