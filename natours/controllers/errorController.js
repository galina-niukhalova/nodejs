const AppError = require('../utils/appError');

const sentErrorDev = (resp, err) => resp.status(err.statusCode)
  .json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

const sentErrorProd = (resp, err) => {
  // Operation errors, which we created by appError
  if (err.isOperational) {
    resp.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Unknown system error
  } else {
    console.error('Error 💥', err);

    resp.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
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
    sentErrorDev(resp, error);
  } else if (process.env.NODE_ENV === 'production') {
    // Mongodb errors
    if (error.name === 'CastError') { error = handleCastErrorDB(error); }
    if (error.code === 11000) { error = handleDuplicateFieldsDB(error); }
    if (error.name === 'ValidationError') { error = handleValidationErrorDB(error); }
    if (error.name === 'JsonWebTokenError') { error = handleJWTError(); }
    if (error.name === 'TokenExpiredError') { error = handleJWTExpiredError(); }

    sentErrorProd(resp, error);
  }


  next();
};
