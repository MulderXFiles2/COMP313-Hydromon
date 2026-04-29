/**
 * Device.js (ingestor)
 *
 * Must stay in sync with server/src/models/device.model.js.
 * Includes `name` field so the server's rename feature works.
 */

const mongoose = require('mongoose');

if (mongoose.models.Device) {
  module.exports = mongoose.models.Device;
} else {
  const DeviceSchema = new mongoose.Schema(
    {
      deviceId: { type: String, required: true, unique: true, index: true },

      // Human-readable label, set via the dashboard
      name: { type: String, default: null },

      // Status/health
      lastSeenAt:      { type: Date,    default: null },
      lastTelemetryAt: { type: Date,    default: null },
      online:          { type: Boolean, default: false },

      // Optional reported fields
      uptimeSec: { type: Number, default: null },
      rssi:      { type: Number, default: null },
      ip:        { type: String, default: null },
    },
    { timestamps: true }
  );

  module.exports = mongoose.model('Device', DeviceSchema);
}