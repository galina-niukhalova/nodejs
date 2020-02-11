const dotenv = require('dotenv');

dotenv.config({
  path: 'natours/config.env',
});

const app = require('./app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
