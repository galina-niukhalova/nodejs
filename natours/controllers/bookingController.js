const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, resp) => {
  // 1. Get the current booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, // in cents
        currency: 'USD',
        quantity: 1,
      },
    ],
  });

  // 3. Create session as response
  resp.status(200).json({
    status: 'success',
    session,
  });
});


// exports.createBookingCheckout = catchAsync(async (req, resp, next) => {
//   // This is only temporary, because it's not secure
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) {
//     return next();
//   }

//   await Booking.create({
//     tour, user, price,
//   });

//   resp.redirect(req.originalUrl.split('?')[0]);
//   return next();
// });

const createBookingCheckout = catchAsync(async (session) => {
  const { client_reference_id: tour, customer_email: email, line_items } = session;
  const price = line_items[0].amount / 100;

  const user = (await User.findOne({ email })).id;

  await Booking.create({
    tour, user, price,
  });
});

exports.webhookCheckout = (req, resp, next) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return resp.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === 'checkout.session.complete') {
    createBookingCheckout(event.data.object);
  }

  resp.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking, { path: 'user' });
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
