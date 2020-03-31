class AppError extends Error {
  constructor(message, statusCode) {
    // to call parent constructor
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // to not add AppError to error stack
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
