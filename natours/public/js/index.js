/* eslint-disable */
import '@babel/polyfill'
import { login, logout } from './login';
import { updateSettings } from './updateSettings'
import { displayMap } from './mapbox';
import { bookTour } from './stripe'

const mapBox = document.getElementById('map');
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

const loginForm = document.querySelector('.login-form .form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

const logoutBtn = document.getElementById('logout')
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    logout();
  })
}

const updateDataForm = document.querySelector('.form-user-data');
if(updateDataForm) {
  updateDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // multipart/form-data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings({ data: form, type: 'data' })
  })
}

const updatePasswordForm = document.querySelector('.form-user-settings')
if(updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    document.querySelector('.btn-save-password').textContent = 'Updating...';

    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    updateSettings({
      data: {
        currentPassword,
        password,
        passwordConfirm
      },
      type: 'password',
    });

    document.querySelector('.btn-save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  })
}

const bookTourBtn = document.getElementById('book-tour')
if(bookTourBtn) {
  bookTourBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';

    const { tourId } = e.target.dataset;
    bookTour(tourId)
  })
}


