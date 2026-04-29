/**
 * alertEvaluator.js
 *
 * Evaluates incoming telemetry readings against alert rules.
 * Determines whether alerts should be generated based on thresholds,
 * missing data, or abnormal conditions.
 *
 * In monitoring-only mode, this service does not issue control actions.
 *
 * NOTE: Stub for now — we’ll wire rules + alerts storage after ingestion is stable.
 */

const Alert = require('../models/Alert');
const AlertRule = require('../models/AlertRule');
const AlertEmailDelivery = require('../models/AlertEmailDelivery');
const { sendEmail } = require('./emailDelivery');
const logger = require('../utils/logger');

const SENSOR_LABELS = {
  ph: 'pH',
  ec: 'EC',
  waterTempC: 'Water Temp',
  airTempC: 'Air Temp',
  humidityPct: 'Humidity',
  co2ppm: 'CO2',
  par: 'PAR',
  waterLevelPct: 'Water Level',
  flowRateLpm: 'Flow Rate',
  orpMv: 'ORP',
  dissolvedOxygenMgL: 'Dissolved Oxygen'
};

function compare(value, operator, threshold) {
  switch (operator) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'gte':
      return value >= threshold;
    case 'lte':
      return value <= threshold;
    case 'eq':
      return value === threshold;
    default:
      return false;
  }
}

function normalizeRecipients(recipients = []) {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return [...new Set(
    recipients
      .map((recipient) => String(recipient || '').trim().toLowerCase())
      .filter(Boolean)
  )];
}

function buildEmailContent(alertDoc, rule) {
  const subject = `[HydroMon] ${String(alertDoc.severity || 'warning').toUpperCase()} alert for ${alertDoc.deviceId}`;
  const lines = [
    `Device: ${alertDoc.deviceId}`,
    `Severity: ${alertDoc.severity}`,
    `Sensor: ${SENSOR_LABELS[alertDoc.sensorType] || alertDoc.sensorType}`,
    `Observed value: ${alertDoc.value}`,
    `Rule condition: ${rule.sensorType} ${rule.operator} ${rule.threshold}`,
    `Message: ${alertDoc.message}`,
    `Triggered at: ${new Date(alertDoc.createdAt || Date.now()).toLocaleString()}`
  ];

  if (rule.description && rule.description.trim()) {
    lines.push(`Details: ${rule.description.trim()}`);
  }

  return {
    subject,
    text: lines.join('\n'),
    html: lines.map((line) => `<p>${line}</p>`).join('')
  };
}

async function deliverAlertEmails(alertDoc, rule) {
  if (!rule.emailEnabled) {
    return;
  }

  const recipients = normalizeRecipients(rule.emailRecipients);
  if (recipients.length === 0) {
    return;
  }

  const { subject, text, html } = buildEmailContent(alertDoc, rule);

  for (const recipientEmail of recipients) {
    try {
      const result = await sendEmail({
        to: recipientEmail,
        subject,
        text,
        html
      });

      await AlertEmailDelivery.create({
        alertId: alertDoc._id,
        ruleId: rule._id,
        deviceId: alertDoc.deviceId,
        recipientEmail,
        subject,
        status: result.status,
        transport: result.transport,
        messageId: result.messageId,
        errorMessage: result.errorMessage,
        deliveredAt: result.deliveredAt
      });
    } catch (err) {
      logger.error('Email alert delivery failed', {
        alertId: String(alertDoc._id),
        ruleId: String(rule._id),
        recipientEmail,
        error: err.message || String(err)
      });

      await AlertEmailDelivery.create({
        alertId: alertDoc._id,
        ruleId: rule._id,
        deviceId: alertDoc.deviceId,
        recipientEmail,
        subject,
        status: 'failed',
        transport: 'smtp',
        messageId: '',
        errorMessage: err.message || String(err),
        deliveredAt: null
      });
    }
  }
}

async function evaluateAlertsForTelemetry({ deviceId, timestamp, readings }) {
  for (const [sensorType, value] of Object.entries(readings || {})) {
    if (value === null || value === undefined) {
      continue;
    }

    const rules = await AlertRule.find({
      deviceId,
      ruleType: 'threshold',
      active: true,
      sensorType
    }).lean();

    for (const rule of rules) {
      if (!compare(value, rule.operator, rule.threshold)) {
        continue;
      }

      const alertDoc = await Alert.create({
        deviceId,
        sensorType,
        value,
        ruleId: rule._id,
        severity: rule.severity,
        message: rule.message && rule.message.trim()
          ? rule.message
          : `${SENSOR_LABELS[sensorType] || sensorType} ${value} triggered alert (${rule.operator} ${rule.threshold})`
      });

      await deliverAlertEmails(alertDoc, rule);
    }
  }
}

module.exports = { evaluateAlertsForTelemetry };
