/**
 * devices.controller.js
 */

import * as devicesService from "../services/devices.service.js";
import Device from "../models/Device.js"; // ← matches your actual filename

export async function createDevice(req, res, next) {
  try {
    const device = await devicesService.createDevice(req.body);
    res.status(201).json(device);
  } catch (err) {
    next(err);
  }
}

export async function listDevices(req, res, next) {
  try {
    const devices = await devicesService.getDevices();
    res.json(devices);
  } catch (err) {
    next(err);
  }
}

// GET /devices/:id — looks up by deviceId string (e.g. "tent-1")
export const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.id });
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch device info" });
  }
};

// PATCH /devices/:id — rename a device
export const updateDevice = async (req, res) => {
  try {
    const { name } = req.body;
    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.id },
      { name },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update device" });
  }
};