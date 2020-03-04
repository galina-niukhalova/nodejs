class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * tours?duration[gte]=5&difficulty=easy
   * gte - operator
   */
  filter() {
    let queryObj = Object.assign(this.queryString);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryObj = JSON.parse(queryStr);

    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((excludedField) => delete queryObj[excludedField]);

    this.query.find(queryObj);

    return this;
  }

  /**
   * tours?sort=-price - revert order
   * sort('price ratingsAverage')
   *  - second arg will apply if 2 items have the same result by price filtering
   */
  sorting() {
    let sortBy = '-createdAt';
    if (this.queryString.sort) {
      sortBy = this.queryString.sort.split(',').join(' ');
    }

    this.query.sort(sortBy);

    return this;
  }

  limiting() {
    let limitBy;
    if (this.queryString.fields) {
      limitBy = this.queryString.fields.split(',').join(' ');
    } else {
      limitBy = '-__v ';
    }

    this.query.select(limitBy);

    return this;
  }

  pagination() {
    let skipNumber;
    const limit = Number(this.queryString.limit) || 10;

    if (this.queryString.page) {
      skipNumber = (this.queryString.page - 1) * limit;
      this.query.skip(skipNumber).limit(limit);
    } else if (this.queryString.limit) {
      this.query.limit(limit);
    }

    return this;
  }
}

module.exports = APIFeatures;
