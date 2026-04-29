/**
 * telemetry.schema.js
 *
 * Validation schemas for telemetry-related requests.
 * Defines expected query parameters and request shapes
 * for telemetry API endpoints.
 */

import Joi from "joi";

export const createTelemetrySchema = Joi.object({
  deviceId: Joi.string().required(),
  timestamp: Joi.date().optional(),
  receivedAt: Joi.date().optional(),

  readings: Joi.object({
    ph: Joi.number().allow(null).optional(),
    ec: Joi.number().allow(null).optional(),
    waterTempC: Joi.number().allow(null).optional(),
    airTempC: Joi.number().allow(null).optional(),
    humidityPct: Joi.number().allow(null).optional(),
    co2ppm: Joi.number().allow(null).optional(),
    par: Joi.number().allow(null).optional(),
    waterLevelPct: Joi.number().allow(null).optional(),
    flowRateLpm: Joi.number().allow(null).optional(),
    orpMv: Joi.number().allow(null).optional(),
    dissolvedOxygenMgL: Joi.number().allow(null).optional()
  })
    .min(1)
    .required()
});