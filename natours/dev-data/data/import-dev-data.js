const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const Users = require('../../models/userModel');

dotenv.config({
  path: 'natours/config.env',
});

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


const tours = JSON.parse(fs.readFileSync('natours/dev-data/data/tours.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('natours/dev-data/data/reviews.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('natours/dev-data/data/users.json', 'utf-8'));

// IMPORT TOURS from FILE
const importData = async () => {
  try {
    await Tour.create(tours);
    await Review.create(reviews);
    await Users.create(users, { validateBeforeSave: false });
    console.log('Data successfully imported');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// DELETE TOURS from db
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await Users.deleteMany();
    console.log('Data successfully deleted');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
