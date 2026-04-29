/**
 * validatePayload.js
 *
 * Utility for validating incoming MQTT payloads.
 * Ensures telemetry and status messages conform to expected schemas
 * before being processed or stored.
 */

const Joi = require('joi');

const telemetrySchema = Joi.object({
  timestamp: Joi.string().isoDate().required(),
  readings: Joi.object({
    ph: Joi.number(),
    ec: Joi.number(),
    waterTempC: Joi.number(),
    airTempC: Joi.number(),
    humidityPct: Joi.number(),
    co2ppm: Joi.number(),
    par: Joi.number(),
    waterLevelPct: Joi.number(),
    flowRateLpm: Joi.number(),
    orpMv: Joi.number(),
    dissolvedOxygenMgL: Joi.number()
  })
    .min(1)
    .required()
}).required();

const statusSchema = Joi.object({
  timestamp: Joi.string().isoDate().required(),
  uptimeSec: Joi.number().integer().min(0).optional(),
  rssi: Joi.number().integer().optional(),
  ip: Joi.string().optional()
}).required();

function parseJson(payloadText) {
  try {
    return JSON.parse(payloadText);
  } catch (err) {
    return { __parseError: true, __errorMessage: err.message };
  }
}

function validateTelemetry(payloadText) {
  const parsed = parseJson(payloadText);
  if (parsed.__parseError) {
    return { ok: false, error: `Invalid JSON: ${parsed.__errorMessage}` };
  }

  const { error, value } = telemetrySchema.validate(parsed, { abortEarly: false, stripUnknown: true });
  if (error) {
    return { ok: false, error: error.details.map((d) => d.message).join('; ') };
  }

  return { ok: true, value };
}

function validateStatus(payloadText) {
  const parsed = parseJson(payloadText);
  if (parsed.__parseError) {
    return { ok: false, error: `Invalid JSON: ${parsed.__errorMessage}` };
  }

  const { error, value } = statusSchema.validate(parsed, { abortEarly: false, stripUnknown: true });
  if (error) {
    return { ok: false, error: error.details.map((d) => d.message).join('; ') };
  }

  return { ok: true, value };
}

module.exports = {
  validateTelemetry,
  validateStatus
};
