const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const routes = require('./routes');
const errorHandler = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable cors
app.use(cors());

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Parse json request body
app.use(express.json({ limit: '10kb' }));

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, 'Not found'));
});

// Error handler
app.use(errorHandler);

module.exports = app;
