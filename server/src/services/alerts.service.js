import Alert from "../models/Alert.js";
import AlertRule from "../models/AlertRule.js";
import AlertEmailDelivery from "../models/AlertEmailDelivery.js";
import { logger } from "../utils/logger.js";
import { sendEmail } from "./email.service.js";
import {
  getCurrentHHMMInZone,
  getCurrentDayOfWeekInZone,
} from "../utils/time.js";

function compare(value, operator, threshold) {
  switch (operator) {
    case "gt":
      return value > threshold;
    case "lt":
      return value < threshold;
    case "gte":
      return value >= threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
    default:
      return false;
  }
}

const SENSOR_LABELS = {
  ph: "pH",
  ec: "EC",
  waterTempC: "Water Temp",
  airTempC: "Air Temp",
  humidityPct: "Humidity",
  co2ppm: "CO2",
  par: "PAR",
  waterLevelPct: "Water Level",
  flowRateLpm: "Flow Rate",
  orpMv: "ORP",
  dissolvedOxygenMgL: "Dissolved Oxygen",
};

function normalizeEmailRecipients(recipients = []) {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return [
    ...new Set(
      recipients
        .map((recipient) => String(recipient || "").trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function buildAlertEmailContent(alert, rule) {
  const subject = `[HydroMon] ${String(alert.severity || "warning").toUpperCase()} alert for ${alert.deviceId}`;
  const triggeredAt = new Date(alert.createdAt || Date.now()).toLocaleString();

  const lines = [
    `Device: ${alert.deviceId}`,
    `Severity: ${alert.severity}`,
    `Type: ${alert.category}`,
    `Triggered at: ${triggeredAt}`,
    `Message: ${alert.message}`,
  ];

  if (alert.sensorType && alert.sensorType !== "scheduled") {
    lines.splice(
      3,
      0,
      `Sensor: ${SENSOR_LABELS[alert.sensorType] || alert.sensorType}`
    );
  }

  if (
    alert.value !== null &&
    alert.value !== undefined &&
    alert.sensorType !== "scheduled"
  ) {
    lines.splice(4, 0, `Observed value: ${alert.value}`);
  }

  if (rule?.ruleType === "threshold") {
    lines.push(
      `Rule condition: ${rule.sensorType} ${rule.operator} ${rule.threshold}`
    );
  }

  if (rule?.ruleType === "scheduled") {
    lines.push(`Schedule: ${rule.scheduleType}`);
  }

  if (rule?.description?.trim()) {
    lines.push(`Details: ${rule.description.trim()}`);
  }

  const text = lines.join("\n");
  const html = lines.map((line) => `<p>${line}</p>`).join("");

  return { subject, text, html };
}

async function deliverAlertEmails(alert, rule) {
  if (!rule?.emailEnabled) {
    return;
  }

  const recipients = normalizeEmailRecipients(rule.emailRecipients);

  if (recipients.length === 0) {
    return;
  }

  const { subject, text, html } = buildAlertEmailContent(alert, rule);

  for (const recipientEmail of recipients) {
    try {
      const result = await sendEmail({
        to: recipientEmail,
        subject,
        text,
        html,
      });

      await AlertEmailDelivery.create({
        alertId: alert._id,
        ruleId: rule._id,
        deviceId: alert.deviceId,
        recipientEmail,
        subject,
        status: result.status,
        transport: result.transport,
        messageId: result.messageId,
        errorMessage: result.errorMessage,
        deliveredAt: result.deliveredAt,
      });
    } catch (err) {
      logger.error("Email alert delivery failed", {
        alertId: String(alert._id),
        ruleId: String(rule._id),
        recipientEmail,
        error: err.message || String(err),
      });

      await AlertEmailDelivery.create({
        alertId: alert._id,
        ruleId: rule._id,
        deviceId: alert.deviceId,
        recipientEmail,
        subject,
        status: "failed",
        transport: "smtp",
        messageId: "",
        errorMessage: err.message || String(err),
        deliveredAt: null,
      });
    }
  }
}

async function createAlertEvent({
  rule,
  deviceId,
  sensorType,
  value,
  severity,
  message,
  category = "threshold",
}) {
  const alert = await Alert.create({
    deviceId,
    sensorType,
    value,
    ruleId: rule._id,
    severity,
    message,
    category,
  });

  await deliverAlertEmails(alert, rule);

  return alert;
}

export async function evaluateTelemetryReading(telemetry) {
  const readings = telemetry.readings || {};

  for (const [sensorType, readingData] of Object.entries(readings)) {
    const value =
      typeof readingData === "object" ? readingData.value : readingData;

    if (value === null || value === undefined) continue;

    const label =
      typeof readingData === "object" && readingData.label
        ? readingData.label
        : SENSOR_LABELS[sensorType] || sensorType;

    const alerts = await AlertRule.find({
      deviceId: telemetry.deviceId,
      ruleType: "threshold",
      active: true,
      sensorType,
    }).lean();

    for (const alert of alerts) {
      if (compare(value, alert.operator, alert.threshold)) {
        await createAlertEvent({
          rule: alert,
          deviceId: telemetry.deviceId,
          sensorType,
          value,
          severity: alert.severity,
          message: alert.message?.trim()
            ? alert.message
            : `${label} ${value} triggered alert (${alert.operator} ${alert.threshold})`,
        });
      }
    }
  }
}

function sameMinute(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function evaluateScheduledAlerts(now = new Date()) {
  const rules = await AlertRule.find({
    ruleType: "scheduled",
    active: true,
  });

  logger.info("Evaluating scheduled alerts", {
    nowIso: now.toISOString(),
    nowLocal: now.toString(),
    serverTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    totalRules: rules.length,
  });

  for (const alert of rules) {
    const timeZone = alert.timeZone || "UTC";
    const hhmm = getCurrentHHMMInZone(now, timeZone);
    const dayOfWeek = getCurrentDayOfWeekInZone(now, timeZone);

    logger.info("Checking scheduled alert", {
      id: alert._id?.toString(),
      deviceId: alert.deviceId,
      scheduleType: alert.scheduleType,
      time: alert.time,
      dayOfWeek: alert.dayOfWeek,
      date: alert.date,
      active: alert.active,
      lastTriggeredAt: alert.lastTriggeredAt,
      alertTimeZone: timeZone,
      currentHHMMInZone: hhmm,
      currentDayOfWeekInZone: dayOfWeek,
    });

    let shouldTrigger = false;

    if (alert.scheduleType === "daily") {
      shouldTrigger = alert.time === hhmm;
    } else if (alert.scheduleType === "weekly") {
      shouldTrigger = alert.time === hhmm && alert.dayOfWeek === dayOfWeek;
    } else if (alert.scheduleType === "once") {
      if (alert.date && !alert.lastTriggeredAt) {
        shouldTrigger = sameMinute(new Date(alert.date), now);
      }
    }

    logger.info("Scheduled alert match result", {
      id: alert._id?.toString(),
      shouldTrigger,
      alertTime: alert.time,
      currentHHMMInZone: hhmm,
      alertTimeZone: timeZone,
    });

    if (!shouldTrigger) continue;

    try {
      logger.info("Creating triggered alert", {
        id: alert._id?.toString(),
        deviceId: alert.deviceId,
        message: alert.message,
      });

      await createAlertEvent({
        rule: alert,
        deviceId: alert.deviceId,
        sensorType: "scheduled",
        value: 0,
        severity: alert.severity,
        message: alert.message?.trim() || "Scheduled alert triggered",
        category: "scheduled",
      });

      alert.lastTriggeredAt = now;

      if (alert.scheduleType === "once") {
        alert.active = false;
      }

      await alert.save();
    } catch (err) {
      logger.error("Failed to create triggered alert", {
        id: alert._id?.toString(),
        error: err.message || String(err),
      });
    }
  }
}

export async function getLiveAlerts(filters = {}) {
  const query = {};

  if (filters.deviceId) {
    query.deviceId = filters.deviceId;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.severity) {
    query.severity = filters.severity;
  }

  const windowSeconds = Number(filters.windowSeconds || 300);
  const since = new Date(Date.now() - windowSeconds * 1000);

  query.createdAt = { $gte: since };

  return Alert.find(query).sort({ createdAt: -1 }).lean();
}

export async function getAlerts(filters = {}) {
  const query = {};

  if (filters.deviceId) {
    query.deviceId = filters.deviceId;
  }

  if (filters.ruleType) {
    query.ruleType = filters.ruleType;
  }

  if (filters.active === "true") {
    query.active = true;
  } else if (filters.active === "false") {
    query.active = false;
  }

  return AlertRule.find(query).sort({ createdAt: -1 }).lean();
}

export async function getAlertById(id) {
  return AlertRule.findById(id).lean();
}

export async function createAlert(data, actor) {
  const emailRecipients = normalizeEmailRecipients(
    data.emailEnabled
      ? data.emailRecipients?.length
        ? data.emailRecipients
        : [actor?.email]
      : []
  );

  return AlertRule.create({
    ...data,
    emailRecipients,
    createdByUserId: actor?.id || null,
    createdByEmail: actor?.email || "",
  });
}

export async function updateAlert(id, data, actor) {
  const existing = await AlertRule.findById(id);

  if (!existing) {
    return null;
  }

  const emailRecipients = normalizeEmailRecipients(
    data.emailEnabled
      ? data.emailRecipients?.length
        ? data.emailRecipients
        : existing.emailRecipients?.length
          ? existing.emailRecipients
          : [actor?.email || existing.createdByEmail]
      : []
  );

  Object.assign(existing, {
    ...data,
    emailRecipients,
  });

  await existing.validate();
  await existing.save();

  return existing;
}

export async function deleteAlert(id) {
  return AlertRule.findByIdAndDelete(id);
}