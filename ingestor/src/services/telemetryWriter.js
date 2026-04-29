/**
 * telemetryWriter.js
 *
 * Service responsible for persisting telemetry readings to the database.
 * Handles creation of telemetry records and any required preprocessing
 * before storage.
 */

const TelemetryReading = require('../models/TelemetryReading');

async function writeTelemetry({ deviceId, timestamp, receivedAt, readings }) {
  const doc = new TelemetryReading({
    deviceId,
    timestamp,
    receivedAt,
    readings
  });

  return doc.save();
}

module.exports = { writeTelemetry };
