/**
 * telemetry.handler.js
 *
 * Handles incoming telemetry messages from MQTT.
 * Responsible for parsing payloads, validating data,
 * normalizing readings, and passing them to persistence services.
 */

const logger = require('../../utils/logger');
const { validateTelemetry } = require('../../utils/validatePayload');
const { writeTelemetry } = require('../../services/telemetryWriter');
const { touchDeviceFromTelemetry } = require('../../services/deviceStatus');
const { evaluateAlertsForTelemetry } = require('../../services/alertEvaluator');

async function handleTelemetryMessage({ deviceId, topic, payloadText, receivedAt }) {
  const result = validateTelemetry(payloadText);

  if (!result.ok) {
    logger.warn('Invalid telemetry payload', { deviceId, topic, error: result.error });
    return;
  }

  const payload = result.value;
  const timestamp = new Date(payload.timestamp);

  // Persist telemetry
  await writeTelemetry({
    deviceId,
    timestamp,
    receivedAt,
    readings: payload.readings
  });

  // Update device “last seen” and telemetry time
  await touchDeviceFromTelemetry({ deviceId, when: receivedAt });

  // Optional alert evaluation (stubbed)
  await evaluateAlertsForTelemetry({
    deviceId,
    timestamp,
    readings: payload.readings
  });

  logger.debug('Telemetry ingested', { deviceId, at: payload.timestamp });
}

module.exports = { handleTelemetryMessage };
