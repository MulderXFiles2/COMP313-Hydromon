/**
 * MetricCard.jsx
 *
 * Reusable display component for a single sensor value.
 * Shows a label, current value, unit, and optional status indicator.
 *
 * Used throughout the dashboard for "at-a-glance" monitoring.
 */

import { useEffect, useState } from "react";
import LiveStatusBadge from "./LiveStatusBadge";
import "./MetricCard.css";

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalizedValue.getTime())) {
    return null;
  }

  return normalizedValue;
}

function formatRelativeUpdateTime(timestamp, now = Date.now()) {
  const elapsedMs = Math.max(0, now - timestamp.getTime());
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < 5) {
    return "just now";
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

function formatUpdateTimestamp(timestamp) {
  return timestamp.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function MetricCard({
  label = "Unknown Sensor",
  value = null,
  unit = "",
  lastSeen = null,
  staleAfterMs = 10_000,
  offlineAfterMs = 30_000
}) {
  const [, setRefreshTick] = useState(0);
  const telemetryTimestamp = normalizeTimestamp(lastSeen);
  const telemetryTimestampMs = telemetryTimestamp?.getTime() ?? null;

  useEffect(() => {
    if (!telemetryTimestampMs) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setRefreshTick((currentTick) => currentTick + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [telemetryTimestampMs]);

  const freshnessText = telemetryTimestamp
    ? `Updated ${formatRelativeUpdateTime(telemetryTimestamp)}`
    : "Awaiting telemetry";

  const timestampText = telemetryTimestamp
    ? formatUpdateTimestamp(telemetryTimestamp)
    : "No timestamp yet";

  return (
    <div className="card">
      <span className="label">
        {label}
      </span>

      <div className="value-container">
        <span className="value">
          {value ?? "N/A"}
        </span>
        <span className="unit">
          {unit}
        </span>
      </div>

      <LiveStatusBadge
        lastSeen={telemetryTimestamp}
        staleAfterMs={staleAfterMs}
        offlineAfterMs={offlineAfterMs}
      />

      <div className="freshness">
        <span className="freshness-label">{freshnessText}</span>
        {telemetryTimestamp ? (
          <time className="freshness-time" dateTime={telemetryTimestamp.toISOString()}>
            {timestampText}
          </time>
        ) : (
          <span className="freshness-time">{timestampText}</span>
        )}
      </div>
    </div>
  );
}

export default MetricCard;