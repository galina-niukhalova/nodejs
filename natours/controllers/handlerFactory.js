const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) => catchAsync(async (req, resp, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);

  if (!doc) {
    // eslint-disable-next-line no-new
    return next(new AppError(`No document found with the id ${req.params.id}`, 404));
  }

  resp.status(204).json({
    status: 'Success',
    data: null,
  });

  return null;
});


exports.updateOne = (Model) => catchAsync(async (req, resp, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    /** will check model validation */
    runValidators: true,
  });

  if (!doc) {
    // eslint-disable-next-line no-new
    return next(new AppError(`No document found with the id ${req.params.id}`, 404));
  }

  resp.status(200).json({
    status: 'Success',
    data: {
      data: doc,
    },
  });

  return null;
});


exports.createOne = (Model) => catchAsync(async (req, resp) => {
  const doc = await Model.create(req.body);

  resp.status(200).json({
    status: 'Success',
    data: {
      data: doc,
    },
  });
});

exports.getOne = (Model, populateOptions) => catchAsync(async (req, resp, next) => {
  // populate will replace guides id to the actual data
  let query = Model.findById(req.params.id);
  if (populateOptions) {
    query = query.populate(populateOptions);
  }

  const doc = await query;

  if (!doc) {
    // eslint-disable-next-line no-new
    return next(new AppError(`No document found with the id ${req.params.id}`, 404));
  }

  resp.status(200).json({
    status: 'Success',
    data: {
      data: doc,
    },
  });

  return null;
});

exports.getAll = (Model) => catchAsync(async (req, resp) => {
  // To allow for nested GET reviews on tour (hack)
  // eslint-disable-next-line no-underscore-dangle
  const { tourId } = req.params;
  let filter = {};
  if (tourId) {
    filter = { tour: tourId };
  }

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sorting()
    .limiting()
    .pagination();

  const docs = await features.query;// .explain();

  resp.status(200).json({
    status: 'success',
    results: docs.length,
    data: {
      data: docs,
    },
  });
});
