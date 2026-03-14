const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { startUploadsCleanup } = require('./jobs/uploadsCleanup');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

const shouldRunCleanup = process.env.UPLOADS_CLEANUP_ENABLED !== 'false'
  && (process.env.NODE_APP_INSTANCE === undefined || process.env.NODE_APP_INSTANCE === '0');

if (shouldRunCleanup) {
  startUploadsCleanup({
    ttlMs: process.env.UPLOADS_TTL_MS ? Number(process.env.UPLOADS_TTL_MS) : 60 * 60 * 1000,
    intervalMs: process.env.UPLOADS_CLEAN_INTERVAL_MS ? Number(process.env.UPLOADS_CLEAN_INTERVAL_MS) : 15 * 60 * 1000,
    logger
  });
}

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
