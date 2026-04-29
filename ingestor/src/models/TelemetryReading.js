/**
 * TelemetryReading.js (ingestor)
 *
 * Must stay in sync with server/src/models/TelemetryReading.js.
 * Both use deviceId as { type: String } — never ObjectId.
 */

const mongoose = require('mongoose');

// Prevent model re-registration error if module is hot-reloaded
if (mongoose.models.TelemetryReading) {
  module.exports = mongoose.models.TelemetryReading;
} else {
  const TelemetryReadingSchema = new mongoose.Schema(
    {
      deviceId:   { type: String, required: true, index: true },
      timestamp:  { type: Date,   required: true, index: true },
      receivedAt: { type: Date,   required: true },

      readings: {
        ph:                 { type: Number, default: null },
        ec:                 { type: Number, default: null },
        waterTempC:         { type: Number, default: null },
        airTempC:           { type: Number, default: null },
        humidityPct:        { type: Number, default: null },
        co2ppm:             { type: Number, default: null },
        par:                { type: Number, default: null },
        waterLevelPct:      { type: Number, default: null },
        flowRateLpm:        { type: Number, default: null },
        orpMv:              { type: Number, default: null },
        dissolvedOxygenMgL: { type: Number, default: null },
      }
    },
    { timestamps: true }
  );

  TelemetryReadingSchema.index({ deviceId: 1, timestamp: -1 });

  module.exports = mongoose.model('TelemetryReading', TelemetryReadingSchema);
}