const express = require('express');
const fs = require('fs');
const morgan = require('morgan');

const app = express();
const TOURS_FILE = 'express/dev-data/data/tours-simple.json';
const tours = JSON.parse(fs.readFileSync(TOURS_FILE));

app.use(express.json());
app.use(morgan('dev'));
// middleware
app.use((req, resp, next) => {
  req.customTime = new Date().toISOString();

  next();
});

function getAllTours(req, resp) {
  resp
    .status(200)
    .json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
}

function getTour(req, resp) {
  const tour = tours.find((el) => el.id === Number(req.params.id));
  console.log(tours, req.params.id);

  if (!tour) {
    resp
      .status(404)
      .json({
        status: 'Error',
        data: null,
      });
  }

  resp
    .status(200)
    .json({
      status: 'Success',
      data: {
        tour,
      },
    });
}

function updateTour(req, resp) {
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
}

function addTour(req, resp) {
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
}

function deleteTour(req, resp) {
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
}

function getUsers(req, resp) {
  resp
    .status(500)
    .message('Route is not defined');
}

function getUser(req, resp) {
  resp
    .status(500)
    .message('Route is not defined');
}

function updateUser(req, resp) {
  resp
    .status(500)
    .message('Route is not defined');
}

function deleteUser(req, resp) {
  resp
    .status(500)
    .message('Route is not defined');
}

const tourRouter = express.Router();
app.use('/api/v1/tours', tourRouter); // mounting router on a new route

const userRouter = express.Router();
app.use('/api/v1/users', userRouter);

tourRouter
  .route('/')
  .get(getAllTours)
  .post(addTour);


tourRouter
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

userRouter
  .route('/')
  .get(getUsers);

userRouter
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

const port = 8000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
