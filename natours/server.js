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
    console.log('DB connection successful!');
  });


const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'], // validator (the second param is an error message)
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
});

const Tour = mongoose.model('Tour', tourSchema);


const testTour = new Tour({
  name: 'The Sea Explorer',
  rating: 4.7,
  price: 497,
});

testTour.save()
  .then((doc) => console.log(doc))
  .catch((er) => console.log(er));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
