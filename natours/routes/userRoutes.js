const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
// patch - because we change user document
router.patch('/resetPassword/:token', authController.resetPassword);

// all routes after this middleware will be protected
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
// photo - input name on the form
router.patch('/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// all routes after this middleware will be available only for admin
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
