/**
 * devices.service.js
 *
 * Business logic related to devices.
 * Responsible for querying and aggregating device metadata
 * and status information from the database.
 */

import Device from "../models/Device.js";

export async function createDevice(data) {
  return Device.create({
    ...data,
    createdAt: new Date()
  });
}

export async function getDevices() {
  return Device.find().sort({ createdAt: -1 }).lean();
}

export async function getDeviceById(deviceId) {
  return Device.findById(deviceId);
}

export async function updateDevice(deviceId, data) {
  return Device.findByIdAndUpdate(
    deviceId,
    data,
    { new: true }
  );
}