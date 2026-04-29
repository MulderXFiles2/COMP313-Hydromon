/**
 * mongo.js
 *
 * Initializes the MongoDB connection for the ingestion service.
 * Handles connection setup, logging, and error handling.
 *
 * Ensures telemetry data can be persisted reliably.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectMongo(mongoUri) {
  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    autoIndex: true
  });

  logger.info('Connected to MongoDB');
}

async function disconnectMongo() {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}

module.exports = { connectMongo, disconnectMongo };
