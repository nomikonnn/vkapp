const express = require('express');
const cors = require('cors'); // Только одно объявление!
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express(); // Объявляем ДО использования!

// CORS - только ОДНА настройка!
app.use(cors({
  origin: [
    'https://vk.com',
    'https://prod-app54587418-e3807501de96.pages-ac.vk-apps.com',
    'http://localhost:5173',
    'http://localhost:5174' // На случай если порт занят
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Явно обрабатываем preflight (OPTIONS) запросы
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;