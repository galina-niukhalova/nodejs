const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    // will transform the email into lowercase
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must contain at least 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    // input is required, but it doesn't mean that the field is required in DB
    required: true,
    /**
     * This only works on CREATE or SAVE
     * ex. User.create()
     * ex. User.save()
     */
    validate: [function (value) {
      return value === this.password;
    }, 'Password confirm and password must match'],
  },
  passwordChangedAt: Date,
});

/**
 * Encrypt (hash) password, before saving it in DB
 */
userSchema.pre('save', async function (next) {
  // We encrypt password only when it was modified
  if (!this.isModified('password')) {
    return;
  }

  // bcrypt algorithm
  this.password = await bcrypt.hash(this.password, 12);

  // delete confirm password in order to not store it in DB
  this.passwordConfirm = undefined;

  next();
});


// instance method - will be available on all documents of the certain collection
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  const isCorrect = await bcrypt.compare(candidatePassword, userPassword);
  return isCorrect;
};

// Check if user is trying to access a protected route after password was changed
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return jwtTimestamp < changedTimestamp;
  }

  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
