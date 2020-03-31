const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');


const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'], // validator (the second param is an error message)
    unique: true,
    strim: true,
    maxlength: [40, 'A tour name must have less or equal 40 characters'],
    minlength: [10, 'A tour name must have more or equal 10 characters'],
    // validate: [validator.isAlpha, 'Tour name must only contain characters'],
  },
  slug: String,
  rating: {
    type: Number,
    default: 4.5,
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour should have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either easy, medium or difficult',
    },
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'A rating must be above 1.0'],
    max: [5, 'A rating must be below 5.0'],
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  // price must be less than the price
  priceDiscount: {
    type: Number,
    // custom validator
    validate(value) {
      return value < this.price;
    },
  },
  summary: {
    type: String,
    // remove all white space in the beginning and end of the string
    trim: true,
    required: [true, 'A tour must have a description'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  // array of strings
  images: [String],
  createAt: {
    type: Date,
    default: Date.now(),
    // field will not display in query result
    select: false,
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/** DOCUMENT middleware */
/** Before the document will be saved to the db */
/** Before .save() and .create() */
/** Next will call the next middleware in stack */
/** pre save hook */
/** this is the current document */
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', (next) => {
  // console.log('Will save document');
  next();
});


/** Runs after all pre middleware functions have completed */
/** post save hook */
tourSchema.post('save', (document, next) => {
  // console.log(document);
  next();
});

// virtual field will not be stored in the DB
// eslint-disable-next-line func-names
tourSchema.virtual('durationWeeks').get(function () {
  // we can't use arrow function as we need "this" keyword
  return this.duration / 7;
});


/** QUERY MIDDLEWARE */
/** Runs before or after the certain query is executed */
/** Pre find hook */
/** Runs before each find query is executed */
/** this is the current query */
// tourSchema.pre('find', function (next) { -> only for find query
tourSchema.pre(/^find/, function (next) { // -> for all quires which start from find
  this.find({ secretTour: { $ne: true } });

  /** Time before query is executed */
  this.start = Date.now();

  next();
});

/** documents - all documents which will be found */
tourSchema.post(/^find/, function (documents, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(documents);
  next();
});

/** Aggregation middleware */
/** This - aggregate */
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
