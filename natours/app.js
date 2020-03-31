const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/tourRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// middleware
app.use((req, resp, next) => {
  req.customTime = new Date().toISOString();

  next();
});

// mounting router on a new route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

/**
 * Because code executed in order from top to down,
 * this will be hit only when the route is not defined above
 */
app.all('*', (req, resp, next) => {
  const error = new AppError(`Can't find ${req.url} on this server!`, 404);

  /**
   * next() with an argument is always an error
   * will skip all middleware in the middle and go straight to error handling middleware
   */
  next(error);
});

/**
 * Global Error handling function
 * If middleware is with 4 arg,
 * express error handling func will be called
 */
app.use(globalErrorHandler);

module.exports = app;
