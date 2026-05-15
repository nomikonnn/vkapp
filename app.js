const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://vk.com',
      /^https:\/\/prod-app54587418-[a-z0-9]+\.pages-ac\.vk-apps\.com$/, // Регулярка для всех URL VK Hosting
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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