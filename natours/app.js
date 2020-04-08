const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

/**
 * Global middleware
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * Will create 2 HTTP headers:
 *  X-RateLimit-Limit and X-RateLimit-Remaining
 */
const limitter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1h for 100 requests
  message: 'Too many requests from this API, please try again in an hour!',
});

/**
 * Set security HTTP headers
 */
app.use(helmet());

/**
 * Limit requests from the same API
 */
app.use('/api', limitter);

/**
 * Body parser, reading data from the body into req.body
 * Limit - will not accepted body more than 10kb
 */
app.use(express.json({ limit: '10kb' }));

/**
 * Data sanitization against NoSQL query injections
 */
app.use(mongoSanitize());

/**
 * Data sanitization against XSS
 */
app.use(xss());

/**
 * Prevent parameter pollution (remove double query string keys)
 */
app.use(hpp({
  // a list of properties for which we allow duplicate query string
  whitelist: [
    'duration',
    'ratingsAverage',
    'ratingsQuantity',
    'maxGroupSize',
    'difficulty',
    'price',
  ],
}));

/**
 * Serving static files
 */
app.use(express.static(`${__dirname}/public`));

/**
 * Test middleware
 */
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
