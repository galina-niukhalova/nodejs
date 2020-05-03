const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const authController = require('../controllers/authController');

const router = express.Router({
  // each router has an access to its specific parameters
  // in order to get params from another router, as for ex.
  // .route('/:tourId/reviews') => to get this tourId
  // when we access reviewRouter from tourRouter
  mergeParams: true,
});

router.use(authController.protect);

router
  .route('/')
  .get(reviewsController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewsController.setTourUserIds,
    reviewsController.createReview,
  );

router
  .route('/:id')
  .get(reviewsController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewsController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewsController.deleteReview,
  );

module.exports = router;
