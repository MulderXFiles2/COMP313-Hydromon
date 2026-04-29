/**
 * deviceStatus.js
 *
 * Service for updating and tracking device connectivity state.
 * Maintains last-seen timestamps and determines whether devices
 * are considered online or stale.
 */

const Device = require('../models/Device');

async function touchDeviceFromTelemetry({ deviceId, when }) {
  return Device.findOneAndUpdate(
    { deviceId },
    {
      $set: {
        online: true,
        lastSeenAt: when,
        lastTelemetryAt: when
      }
    },
    { upsert: true, returnDocument: "after" }
  );
}

async function updateDeviceFromStatus({ deviceId, when, status }) {
  const update = {
    online: true,
    lastSeenAt: when
  };

  if (typeof status.uptimeSec === 'number') update.uptimeSec = status.uptimeSec;
  if (typeof status.rssi === 'number') update.rssi = status.rssi;
  if (typeof status.ip === 'string') update.ip = status.ip;

  return Device.findOneAndUpdate({ deviceId }, { $set: update }, { upsert: true, new: true });
}

module.exports = { touchDeviceFromTelemetry, updateDeviceFromStatus };
