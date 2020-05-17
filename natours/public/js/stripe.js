/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe("pk_test_KqTxQwCWAQWtovM2ouGu4KG200bITGGdt9");

export const bookTour = async (id) => {
  try {
  // 1. get session from the server
  const session = await axios(`http://localhost:8000/api/v1/booking/checkout-session/${id}`);
  console.log(session);

  // 2. Create checkout form + charge credit card
  await stripe.redirectToCheckout({
    sessionId: session.data.session.id,
  })

  } catch(error) {
    console.log(error)
    showAlert('error', error);
  }
};

export default { bookTour };
