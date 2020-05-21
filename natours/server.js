const mongoose = require('mongoose');
const dotenv = require('dotenv');

/**
 * ReferenceError: x is not defined
 * Uncaught exceptions
 * ex: console.log(x); => where x is not exists
 */
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught exception! Shutting down');

  process.exit(1);
});

dotenv.config({
  path: 'natours/config.env',
});

const app = require('./app');

const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  }).then(() => {
    // eslint-disable-next-line no-console
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App is running on port ${port}`);
});

/**
 * UnhandledPromiseRejectionWarning: Unhandled promise rejection.
 * This error originated either by throwing inside of an async function without a catch block,
 * or by rejecting a promise which was not handled with .catch().
 *
 * to handle globally we can subscribe globally to unhandledRejection event
 */
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection! Shutting down');

  server.close(() => {
    process.exit(1);
  });
});

// we need this listening, because heroku shut down all our processes every 24 hours.
process.on('SIGTERM', () => {
  console.log('✋ SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
