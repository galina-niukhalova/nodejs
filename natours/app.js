const path = require('path');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.enable('trust proxy');

// set template engines
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/**
 * Serving static files
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Global middleware
 */
// Implement CORS
// Access-Control-Allow-Origin *
app.use(cors());

// api.natours.com; front-end: natours.com
// app.use(cors({
//   origin: 'https://www.natours.com',
// }));

app.options('*', cors());

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
// parse forms
app.use(express.urlencoded({
  extended: true,
  limit: '10kb',
}));
app.use(cookieParser());

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

app.use(compression());

/**
 * Test middleware
 */
app.use((req, resp, next) => {
  req.customTime = new Date().toISOString();
  next();
});

// mounting router on a new route
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
// if we want to allow CORS for only one route
// app.use('/api/v1/tours', cors(), tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/booking', bookingRouter);

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
