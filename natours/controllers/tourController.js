const Tour = require('./../models/tourModel');

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

/**
 * tours?duration[gte]=5&difficulty=easy
 * gte - operator
 */
function filtering(initialQuery) {
  let queryObj = Object.assign(initialQuery);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  queryObj = JSON.parse(queryStr);

  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((excludedField) => delete queryObj[excludedField]);

  return Tour.find(queryObj);
}

/**
 * tours?sort=-price - revert order
 * sort('price ratingsAverage')
 *  - second arg will apply if 2 items have the same result by price filtering
 */
function sorting(initialQuery, query) {
  let sortBy = '-createdAt';
  if (initialQuery.sort) {
    sortBy = initialQuery.sort.split(',').join(' ');
  }
  return query.sort(sortBy);
}

function limiting(initialQuery, query) {
  let limitBy;
  if (initialQuery.fields) {
    limitBy = initialQuery.fields.split(',').join(' ');
  } else {
    limitBy = '-__v ';
  }
  return query.select(limitBy);
}

async function pagination(initialQuery, query) {
  try {
    let newLimit = query;
    let skipNumber;
    const limit = Number(initialQuery.limit) || 10;

    if (initialQuery.page) {
      skipNumber = (initialQuery.page - 1) * limit;
      const numTours = await Tour.countDocuments();
      if (skipNumber >= numTours) throw new Error('Page does not exist');

      newLimit = query.skip(skipNumber).limit(limit);
    } else if (initialQuery.limit) {
      newLimit = query.limit(limit);
    }

    return {
      query: newLimit,
    };
  } catch ({ errmsg }) {
    return { error: errmsg };
  }
}

exports.getAllTours = async (req, resp) => {
  let query = filtering(req.query);
  query = sorting(req.query, query);
  query = limiting(req.query, query);
  const paginationQuery = pagination(req.query, query);
  if (paginationQuery.error) {
    throw paginationQuery.error;
  } else {
    query = paginationQuery.query;
  }


  const tours = await query;

  try {
    resp
      .status(200)
      .json({
        status: 'success',
        results: tours.length,
        data: {
          tours,
        },
      });
  } catch ({ errmsg }) {
    resp
      .status(404)
      .json({
        status: 'error',
        message: errmsg,
      });
  }
};

exports.getTour = async (req, resp) => {
  try {
    const tour = await Tour.findById(req.params.id);

    resp
      .status(200)
      .json({
        status: 'Success',
        data: {
          tour,
        },
      });
  } catch ({ errmsg }) {
    resp
      .status(404)
      .json({
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

    resp
      .status(200)
      .json({
        status: 'Success',
        data: {
          tour,
        },
      });
  } catch ({ errmsg }) {
    resp
      .status(404)
      .json({
        status: 'Error',
        message: errmsg,
      });
  }
};

exports.createTour = async (req, resp) => {
  try {
    const tour = await Tour.create(req.body);

    resp
      .status(200)
      .json({
        status: 'Success',
        data: {
          tour,
        },
      });
  } catch ({ errmsg }) {
    resp
      .status(404)
      .json({
        status: 'Error',
        message: errmsg,
      });
  }
};

exports.deleteTour = async (req, resp) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    resp
      .status(204)
      .json({
        status: 'Success',
        data: null,
      });
  } catch ({ errmsg }) {
    resp
      .status(404)
      .json({
        status: 'Error',
        message: errmsg,
      });
  }
};
