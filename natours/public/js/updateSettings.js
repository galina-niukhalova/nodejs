/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type = password, data
export const updateSettings = async ({ data, type }) => {
  const url = type === 'password' 
    ? '/api/v1/users/updatePassword' 
    : '/api/v1/users/updateMe'

  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Your data is successfully updated');
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export default {
  updateSettings,
};
