const fs = require('fs');

const TOURS_FILE = 'natours/dev-data/data/tours-simple.json';
const tours = JSON.parse(fs.readFileSync(TOURS_FILE));

exports.checkID = (req, resp, next) => {
  const tour = tours.find((el) => el.id === Number(req.params.id));

  if (!tour) {
    return resp
      .status(404)
      .json({
        status: 'Error',
        data: null,
      });
  }

  return next();
};

exports.checkBody = (req, resp, next) => {
  const { name, price } = req.body;

  if (!name || !price) {
    resp
      .status(404)
      .json({
        status: 'Error',
        message: 'Name and pricing fields are required',
      });
  }

  next();
};

exports.getAllTours = (req, resp) => {
  resp
    .status(200)
    .json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
};

exports.getTour = (req, resp) => {
  const tour = tours.find((el) => el.id === Number(req.params.id));

  resp
    .status(200)
    .json({
      status: 'Success',
      data: {
        tour,
      },
    });
};

exports.updateTour = (req, resp) => {
  let updatedTour;
  const updatedTours = tours.map((el) => {
    if (el.id === Number(req.params.id)) {
      updatedTour = Object.assign(el, req.body);
      return updatedTour;
    }

    return el;
  });
  const data = JSON.stringify(updatedTours);

  fs.writeFile(TOURS_FILE, data, (error) => {
    if (error) {
      resp.status(400).json({
        status: 'Fail',
        message: 'Something went wrong',
      });
    }

    resp.status(200).json({
      status: 'Success',
      data: {
        tour: updatedTour,
      },
    });
  });
};

exports.addTour = (req, resp) => {
  const newId = Number(tours.length + 1);
  const newTour = Object.assign(req.body, { id: newId });
  tours.push(newTour);
  const data = JSON.stringify(tours);

  fs.writeFile(TOURS_FILE, data, (err) => {
    if (err) {
      resp
        .status(404)
        .json({
          status: 'Error',
          data: null,
        });
    }

    resp.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  });
};

exports.deleteTour = (req, resp) => {
  const tourId = Number(req.params.id);
  const tourPosition = tours.findIndex((el) => el.id === tourId);
  tours.splice(tourPosition, 1);

  const data = JSON.stringify(tours);

  fs.writeFile(TOURS_FILE, data, (error) => {
    if (error) {
      resp
        .status(400)
        .message('Something went wrong');
    }

    resp.status(204).json({
      status: 'Success',
      data: null,
    });
  });
};
