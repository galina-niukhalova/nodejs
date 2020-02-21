const mongoose = require('mongoose');
const dotenv = require('dotenv');

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
  }).then(() => {
    // eslint-disable-next-line no-console
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App is running on port ${port}`);
});
