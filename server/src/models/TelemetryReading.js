/**
 * TelemetryReading.js
 *
 * Mongoose model for bundled telemetry packets.
 * Stores timestamped sensor values associated with a device.
 *
 * This schema matches the format written by the ingestor service.
 */

import mongoose from "mongoose";

const telemetryReadingSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    receivedAt: { type: Date, required: true },

    readings: {
      ph: { type: Number, default: null },
      ec: { type: Number, default: null },
      waterTempC: { type: Number, default: null },
      airTempC: { type: Number, default: null },
      humidityPct: { type: Number, default: null },
      co2ppm: { type: Number, default: null },
      par: { type: Number, default: null },
      waterLevelPct: { type: Number, default: null },
      flowRateLpm: { type: Number, default: null },
      orpMv: { type: Number, default: null },
      dissolvedOxygenMgL: { type: Number, default: null }
    }
  },
  { timestamps: true }
);

telemetryReadingSchema.index({ deviceId: 1, timestamp: -1 });

export default mongoose.model("TelemetryReading", telemetryReadingSchema);