/**
 * topics.js
 *
 * Defines MQTT topic patterns used by the ingestion service.
 * Provides helper functions for parsing device identifiers
 * and message context from topic strings.
 *
 * Keeps topic structure consistent across the system.
 */

function getTelemetryTopic(prefix) {
  return `${prefix}/+/telemetry`;
}

function getStatusTopic(prefix) {
  return `${prefix}/+/status`;
}

/**
 * Expected topics:
 *   {prefix}/{deviceId}/telemetry
 *   {prefix}/{deviceId}/status
 */
function parseTopic(prefix, topic) {
  const parts = topic.split('/');
  if (parts.length !== 3) return null;

  const [pfx, deviceId, kind] = parts;
  if (pfx !== prefix) return null;

  if (kind !== 'telemetry' && kind !== 'status') return null;

  return { deviceId, kind };
}

module.exports = {
  getTelemetryTopic,
  getStatusTopic,
  parseTopic
};
