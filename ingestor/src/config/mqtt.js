/**
 * mqtt.js
 *
 * Configures and initializes the MQTT client connection.
 * Defines broker connection options and manages connection lifecycle events.
 *
 * This module abstracts MQTT setup away from message-handling logic.
 */

const mqtt = require('mqtt');
const logger = require('../utils/logger');

function createMqttClient(mqttConfig) {
  const options = {
    clientId: mqttConfig.clientId,
    clean: true,
    connectTimeout: 10_000,
    reconnectPeriod: 2_000
  };

  if (mqttConfig.username) options.username = mqttConfig.username;
  if (mqttConfig.password) options.password = mqttConfig.password;

  logger.info('Connecting to MQTT...', { url: mqttConfig.url, clientId: mqttConfig.clientId });

  return mqtt.connect(mqttConfig.url, options);
}

module.exports = { createMqttClient };
