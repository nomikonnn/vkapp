const express = require('express');
const cors = require('cors');

const routes = require('./routes');

const app = express();

app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    'https://prod-app54587418-1ee29770df41.pages-ac.vk-apps.com'
  );

  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

module.exports = app;