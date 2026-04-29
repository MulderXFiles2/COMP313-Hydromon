/**
 * env.js
 *
 * Loads and validates environment variables required by the ingestion service.
 * Centralizes configuration such as MQTT connection details and database URLs.
 *
 * Ensures the service fails fast if required configuration is missing.
 */

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name, defaultValue = '') {
  return process.env[name] || defaultValue;
}

function loadConfig() {
  const mongoUri = required('MONGO_URI');

  const mqttUrl = required('MQTT_URL');
  const mqttUsername = optional('MQTT_USERNAME', '');
  const mqttPassword = optional('MQTT_PASSWORD', '');
  const mqttClientId = optional('MQTT_CLIENT_ID', 'hydro-ingestor');
  const mqttTopicPrefix = optional('MQTT_TOPIC_PREFIX', 'hydro');

  const logLevel = optional('LOG_LEVEL', 'info');

  return {
    logLevel,
    mongo: {
      uri: mongoUri
    },
    mqtt: {
      url: mqttUrl,
      username: mqttUsername,
      password: mqttPassword,
      clientId: mqttClientId,
      topicPrefix: mqttTopicPrefix
    }
  };
}

module.exports = { loadConfig };
