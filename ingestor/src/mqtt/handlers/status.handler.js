/**
 * status.handler.js
 *
 * Handles incoming device status or heartbeat messages.
 * Updates device last-seen timestamps and connectivity state
 * based on status payloads.
 *
 * Used to detect stale or offline devices.
 */

const logger = require('../../utils/logger');
const { validateStatus } = require('../../utils/validatePayload');
const { updateDeviceFromStatus } = require('../../services/deviceStatus');

async function handleStatusMessage({ deviceId, topic, payloadText, receivedAt }) {
  const result = validateStatus(payloadText);

  if (!result.ok) {
    logger.warn('Invalid status payload', { deviceId, topic, error: result.error });
    return;
  }

  const payload = result.value;

  await updateDeviceFromStatus({
    deviceId,
    when: receivedAt,
    status: payload
  });

  logger.debug('Status ingested', { deviceId, at: payload.timestamp });
}

module.exports = { handleStatusMessage };
