/**
 * telemetry.service.js
 *
 * Business logic for telemetry data access.
 * Handles querying, aggregation, and transformation of
 * sensor readings stored in the database.
 */

import TelemetryReading from "../models/TelemetryReading.js";

export async function createTelemetry(data) {
  // ensure timestamp exists
  if (!data.timestamp) {
    data.timestamp = new Date();
  }

  return TelemetryReading.create(data);
}

export async function getLatestTelemetry(deviceId, limit = 20) {
  return TelemetryReading.find({ deviceId })
    .sort({ timestamp: -1 })
    .limit(Math.min(limit, 5000));
}

export async function getTelemetryInRange(deviceId, since) {
  return TelemetryReading.find({
    deviceId,
    timestamp: { $gte: since },
  }).sort({ timestamp: -1 });
}

// Daily averages for the dashboard

export async function getDailyAverages(deviceId) {
  return TelemetryReading.aggregate([
    { $match: { deviceId } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        avgWaterTempC: { $avg: "$readings.waterTempC" },
        avgPh: { $avg: "$readings.ph" },
        avgHumidityPct: { $avg: "$readings.humidityPct" },
        avgEc: { $avg: "$readings.ec" }
      }
    },
    { $sort: { _id: -1 } }
  ]);
}