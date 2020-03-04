const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, resp, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.checkBody = (req, resp, next) => {
  const { name, price } = req.body;

  if (!name || !price) {
    resp.status(404).json({
      status: 'Error',
      message: 'Name and pricing fields are required',
    });
  }

  next();
};

exports.getAllTours = async (req, resp) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sorting()
      .limiting()
      .pagination();

    const tours = await features.query;

    resp.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch ({ message }) {
    resp.status(404).json({
      status: 'error',
      message,
    });
  }
};

exports.getTour = async (req, resp) => {
  try {
    const tour = await Tour.findById(req.params.id);

    resp.status(200).json({
      status: 'Success',
      data: {
        tour,
      },
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};

exports.updateTour = async (req, resp) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    resp.status(200).json({
      status: 'Success',
      data: {
        tour,
      },
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};

exports.createTour = async (req, resp) => {
  try {
    const tour = await Tour.create(req.body);

    resp.status(200).json({
      status: 'Success',
      data: {
        tour,
      },
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};

exports.deleteTour = async (req, resp) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    resp.status(204).json({
      status: 'Success',
      data: null,
    });
  } catch ({ errmsg }) {
    resp.status(404).json({
      status: 'Error',
      message: errmsg,
    });
  }
};
