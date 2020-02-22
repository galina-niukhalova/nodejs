const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

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


const tours = JSON.parse(fs.readFileSync('natours/dev-data/data/tours-simple.json', 'utf-8'));

// IMPORT TOURS from FILE
const importData = async () => {
  try {
    await Tour.create(tours);
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
