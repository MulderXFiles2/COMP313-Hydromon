/**
 * DashboardPage.jsx
 *
 * Main monitoring dashboard view.
 * Combines metric cards, charts, and device status indicators
 * to provide a real-time overview of system conditions.
 */

import { useEffect, useState } from "react";
import MetricsGrid from "../components/dashboard/MetricsGrid";
import { apiRequest } from "../api/http";
import "./DashboardPage.css";

const SENSOR_LABELS = {
  ph: "Water pH",
  ec: "Water EC",
  waterTempC: "Water Temperature",
  airTempC: "Air Temperature",
  humidityPct: "Humidity",
  co2ppm: "CO₂",
  par: "PAR",
  waterLevelPct: "Water Level",
  flowRateLpm: "Flow Rate",
  orpMv: "ORP",
  dissolvedOxygenMgL: "Dissolved Oxygen"
};

const SENSOR_UNITS = {
  ph: "",
  ec: "",
  waterTempC: "°C",
  airTempC: "°C",
  humidityPct: "%",
  co2ppm: "ppm",
  par: "",
  waterLevelPct: "%",
  flowRateLpm: "L/min",
  orpMv: "mV",
  dissolvedOxygenMgL: "mg/L"
};

async function fetchDevices() {
  return apiRequest("/devices/");
}

async function fetchLatestTelemetry(deviceId) {
  return apiRequest(`/telemetry/latest/${deviceId}`);
}

function toMetrics(readingOrReadings) {
  const reading = Array.isArray(readingOrReadings)
    ? readingOrReadings[0]
    : readingOrReadings;

  if (!reading || !reading.readings) return [];

  return Object.entries(reading.readings)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([sensorKey, value]) => ({
      label: SENSOR_LABELS[sensorKey] ?? sensorKey,
      value,
      unit: SENSOR_UNITS[sensorKey] ?? "",
      lastSeen: reading.timestamp ? new Date(reading.timestamp) : null
    }));
}

export default function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [telemetry, setTelemetry] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Load devices once on mount
  useEffect(() => {
    fetchDevices()
      .then((data) => {
        setDevices(data);
      })
      .catch((err) => {
        console.error(err.message);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 2. Poll telemetry once devices are available
  useEffect(() => {
    if (devices.length === 0) return;

    const loadTelemetry = async () => {
      try {
        const results = await Promise.all(
          devices.map(async (device) => {
            const telemetryDeviceId = device.deviceId;
            if (!telemetryDeviceId) return null;

            const reading = await fetchLatestTelemetry(telemetryDeviceId);

            return {
              telemetryDeviceId,
              metrics: toMetrics(reading)
            };
          })
        );

        const nextTelemetry = {};
        results.forEach((result) => {
          if (!result) return;
          nextTelemetry[result.telemetryDeviceId] = result.metrics;
        });

        setTelemetry(nextTelemetry);
      } catch (err) {
        console.error(err.message);
      }
    };

    loadTelemetry();
    const intervalId = setInterval(loadTelemetry, 5000);

    return () => clearInterval(intervalId);
  }, [devices]);

  if (loading) return <div className="dashboard-status">Loading devices...</div>;
  if (error) return <div className="dashboard-status dashboard-status--error">Error: {error}</div>;

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <div className="device-status">
        <MetricsGrid metrics={telemetry} />
      </div>
    </div>
  );
}