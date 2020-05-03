const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

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
  startLocation: {
    // GeoJSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    // Latitude - horizontal position, equator - 0 degrees, in Arctic - 90 deg
    // Longitude - vertical position, from meridian
    coordinates: [Number], // array of numbers [Longitude, Latitude],
    address: String,
    description: String,
  },
  // Mongo db will create a Document, when we specify an array of objects
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number,
    },
  ],
  // guides: Array, // array of user ids for embedding
  guides: [
    {
      type: mongoose.Schema.ObjectId, // as a reference to user
      ref: 'User',
    },
  ],

}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 }); // Compound index
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.index({ slug: 1 });

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

// **********************************************************
// convert guides ids to actual user documents
// Embedding
// Disadvantages of embedding: each time when user is updated, we will need to update tour as well
// For ex. if user role was changed
// Because of this, it's better to use user reference instead
// **********************************************************
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => {
//     const user = await User.findById(id);
//     return user;
//   });
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });


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

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  // this is the name of field in another model (Review model),
  // where the ref to the current model is stored
  foreignField: 'tour',
  // the name of field, where is foreignField id is stored in the current model
  localField: '_id',
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

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // don't select __v and passwordChangedAt fields
  });

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
