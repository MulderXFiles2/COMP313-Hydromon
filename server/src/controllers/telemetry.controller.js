/**
 * telemetry.controller.js
 *
 * deviceId is a plain STRING ("tent-1"), never an ObjectId.
 * The TelemetryReading schema defines deviceId as { type: String },
 * so we pass it straight through — no casting needed.
 */

import * as telemetryService from "../services/telemetry.service.js";
import * as alertsService from "../services/alerts.service.js";

function downsampleReadings(readings, maxPoints) {
  if (readings.length <= maxPoints) {
    return readings;
  }

  const sampled = [];
  const maxIndex = readings.length - 1;
  let lastIndex = -1;

  for (let position = 0; position < maxPoints; position += 1) {
    const nextIndex = Math.round((position * maxIndex) / (maxPoints - 1));

    if (nextIndex === lastIndex) {
      continue;
    }

    sampled.push(readings[nextIndex]);
    lastIndex = nextIndex;
  }

  return sampled;
}

// POST /telemetry
export async function createTelemetry(req, res, next) {
  try {
    const reading = await telemetryService.createTelemetry(req.body);
    await alertsService.evaluateTelemetryReading(reading);
    res.status(201).json(reading);
  } catch (err) {
    next(err);
  }
}

// GET /telemetry/latest/:deviceId
// Returns the single most-recent reading for a device.
export async function latestTelemetry(req, res, next) {
  try {
    const { deviceId } = req.params; // plain string, e.g. "tent-1"

    // getLatestTelemetry returns an array sorted newest-first
    const results = await telemetryService.getLatestTelemetry(deviceId, 1);
    const reading = Array.isArray(results) ? results[0] ?? null : results;

    res.json(reading);
  } catch (err) {
    next(err);
  }
}

// GET /telemetry/recent/:deviceId?limit=50&hours=24
// Returns history array + per-sensor averages for charting.
export async function recentTelemetry(req, res, next) {
  try {
    const { deviceId } = req.params; // plain string, e.g. "tent-1"
    const limit = Math.min(Number(req.query.limit) || 300, 2400);
    const hours = Math.min(Number(req.query.hours) || 24, 168);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const all = await telemetryService.getTelemetryInRange(deviceId, since);
    const readings = downsampleReadings(all, limit);

    // Compute averages on the full matching set, not only the sampled subset.
    const sums = {};
    const counts = {};
    all.forEach(r => {
      Object.entries(r.readings || {}).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          sums[k]   = (sums[k]   || 0) + v;
          counts[k] = (counts[k] || 0) + 1;
        }
      });
    });

    const averages = {};
    Object.keys(sums).forEach(k => {
      averages[k] = Math.round((sums[k] / counts[k]) * 100) / 100;
    });

    res.json({
      readings,
      averages,
      totalCount: all.length,
      sampledCount: readings.length,
    });
  } catch (err) {
    next(err);
  }
}