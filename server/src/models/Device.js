/**
 * device.js (server)
 *
 * Mongoose model representing a monitored hydroponics device.
 * Must stay in sync with ingestor/models/Device.js.
 */

import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },

    // Human-readable label editable from the dashboard
    name: { type: String, default: null },

    // Status/health info updated by the ingestor
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

export default mongoose.model("Device", deviceSchema);