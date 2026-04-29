/**
 * index.js
 *
 * Entry point for the MQTT ingestion service.
 * Connects to the MQTT broker and MongoDB, subscribes to telemetry topics,
 * and routes incoming messages to the appropriate handlers.
 *
 * This service is responsible only for ingesting and processing incoming data,
 * not for serving HTTP requests.
 */

require('dotenv').config();

const { loadConfig } = require('./config/env');
const { connectMongo, disconnectMongo } = require('./config/mongo');
const { createMqttClient } = require('./config/mqtt');
const { getTelemetryTopic, getStatusTopic, parseTopic } = require('./mqtt/topics');
const { handleTelemetryMessage } = require('./mqtt/handlers/telemetry.handler');
const { handleStatusMessage } = require('./mqtt/handlers/status.handler');
const logger = require('./utils/logger');

async function main() {
  const config = loadConfig();

  logger.info('Starting ingestor...', {
    mqttUrl: config.mqtt.url,
    mongoUri: config.mongo.uri,
    topicPrefix: config.mqtt.topicPrefix
  });

  await connectMongo(config.mongo.uri);

  const mqttClient = createMqttClient(config.mqtt);

  mqttClient.on('connect', () => {
    logger.info('Connected to MQTT broker');

    const telemetrySub = getTelemetryTopic(config.mqtt.topicPrefix);
    const statusSub = getStatusTopic(config.mqtt.topicPrefix);

    mqttClient.subscribe([telemetrySub, statusSub], { qos: 1 }, (err, granted) => {
      if (err) {
        logger.error('MQTT subscribe error', { error: err.message });
        return;
      }
      logger.info('Subscribed to topics', { granted });
    });
  });

  mqttClient.on('reconnect', () => logger.warn('Reconnecting to MQTT broker...'));
  mqttClient.on('close', () => logger.warn('MQTT connection closed'));
  mqttClient.on('offline', () => logger.warn('MQTT client offline'));
  mqttClient.on('error', (err) => logger.error('MQTT error', { error: err.message }));

  mqttClient.on('message', async (topic, payloadBuffer) => {
    const payloadText = payloadBuffer.toString('utf8');

    const parsed = parseTopic(config.mqtt.topicPrefix, topic);
    if (!parsed) {
      logger.warn('Received message on unexpected topic', { topic });
      return;
    }

    try {
      if (parsed.kind === 'telemetry') {
        await handleTelemetryMessage({
          deviceId: parsed.deviceId,
          topic,
          payloadText,
          receivedAt: new Date()
        });
      } else if (parsed.kind === 'status') {
        await handleStatusMessage({
          deviceId: parsed.deviceId,
          topic,
          payloadText,
          receivedAt: new Date()
        });
      } else {
        logger.warn('Unhandled topic kind', { kind: parsed.kind, topic });
      }
    } catch (err) {
      logger.error('Message handling failed', {
        topic,
        deviceId: parsed.deviceId,
        error: err && err.message ? err.message : String(err)
      });
    }
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.warn(`Received ${signal}. Shutting down...`);

    try {
      mqttClient.end(true);
    } catch (_) {}

    try {
      await disconnectMongo();
    } catch (_) {}

    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error', { error: err.message || String(err) });
  process.exit(1);
});
