const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/tourRoutes');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
// middleware
app.use((req, resp, next) => {
  req.customTime = new Date().toISOString();

  next();
});

// mounting router on a new route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
