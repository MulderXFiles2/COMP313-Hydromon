/**
 * DeviceDetailsPage.jsx
 *
 * :deviceId in the URL is the STRING "tent-1", matching device.deviceId.
 * The server route GET /devices/:id does findOne({ deviceId: req.params.id }).
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getAuthHeaders, clearAuthSession } from "../api/auth.api";
import TimeRangePicker from "../components/filters/TimeRangePicker";
import SensorSelect from "../components/filters/SensorSelect";
import "./DeviceDetailsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SENSORS = {
  ph: { label: "pH", unit: "", color: "#646cff" },
  ec: { label: "EC", unit: "mS/cm", color: "#818cf8" },
  waterTempC: { label: "Water Temp", unit: "°C", color: "#22c55e" },
  airTempC: { label: "Air Temp", unit: "°C", color: "#86efac" },
  humidityPct: { label: "Humidity", unit: "%", color: "#38bdf8" },
  co2ppm: { label: "CO₂", unit: "ppm", color: "#fb923c" },
  par: { label: "PAR", unit: "μmol", color: "#facc15" },
  waterLevelPct: { label: "Water Level", unit: "%", color: "#34d399" },
  flowRateLpm: { label: "Flow Rate", unit: "L/min", color: "#a78bfa" },
  orpMv: { label: "ORP", unit: "mV", color: "#f472b6" },
  dissolvedOxygenMgL: { label: "Dissolved O₂", unit: "mg/L", color: "#2dd4bf" },
};

const HISTORY_TIME_RANGES = [
  { value: "0.25", label: "Last 15 Minutes", sampleLimit: 240 },
  { value: "1", label: "Last Hour", sampleLimit: 720 },
  { value: "6", label: "Last 6 Hours", sampleLimit: 1440 },
  { value: "24", label: "Last 24 Hours", sampleLimit: 2400 },
];

function fmt(value, key) {
  if (value === null || value === undefined) return "—";
  const decimals = ["ph", "ec", "waterTempC", "airTempC", "humidityPct", "flowRateLpm", "dissolvedOxygenMgL"].includes(key) ? 2 : 0;
  return Number(value).toFixed(decimals);
}

function timeAgo(dateStr) {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getAvailableSensorKeys(latestReadings = {}, historyReadings = []) {
  const sensorKeySet = new Set();

  Object.entries(latestReadings || {}).forEach(([sensorKey, value]) => {
    if (value !== null && value !== undefined) {
      sensorKeySet.add(sensorKey);
    }
  });

  historyReadings.forEach((reading) => {
    Object.entries(reading.readings || {}).forEach(([sensorKey, value]) => {
      if (value !== null && value !== undefined) {
        sensorKeySet.add(sensorKey);
      }
    });
  });

  return Array.from(sensorKeySet);
}

function ReadingCard({ sensorKey, value, avg }) {
  const meta = SENSORS[sensorKey] || { label: sensorKey, unit: "", color: "#646cff" };
  return (
    <div className="ddp-reading-card" style={{ "--accent": meta.color }}>
      <div className="ddp-reading-label">{meta.label}</div>
      <div className="ddp-reading-value">
        {fmt(value, sensorKey)}
        <span className="ddp-reading-unit">{meta.unit}</span>
      </div>
      {avg !== undefined && (
        <div className="ddp-reading-avg">avg {fmt(avg, sensorKey)}{meta.unit}</div>
      )}
    </div>
  );
}

function SensorChart({ sensorKey, data, avg }) {
  const meta = SENSORS[sensorKey] || { label: sensorKey, unit: "", color: "#646cff" };
  const chartData = [...data].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: r.readings?.[sensorKey] ?? null,
  }));

  return (
    <div className="ddp-chart-card">
      <div className="ddp-chart-header">
        <span className="ddp-chart-title" style={{ color: meta.color }}>{meta.label}</span>
        {avg !== undefined && (
          <span className="ddp-chart-avg">avg {fmt(avg, sensorKey)}{meta.unit}</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color: meta.color }}
          />
          {avg !== undefined && (
            <ReferenceLine y={avg} stroke={meta.color} strokeDasharray="4 4" strokeOpacity={0.4} />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={meta.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DeviceDetailsPage() {
  const { deviceId } = useParams();

  const [device, setDevice] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [averages, setAverages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24");
  const [selectedSensor, setSelectedSensor] = useState("all");
  const [historySummary, setHistorySummary] = useState({ totalCount: 0, sampledCount: 0 });

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDeviceSnapshot = useCallback(async () => {
    try {
      const headers = getAuthHeaders();

      const [deviceRes, latestRes] = await Promise.all([
        fetch(`${API_BASE_URL}/devices/${deviceId}`, { headers }),
        fetch(`${API_BASE_URL}/telemetry/latest/${deviceId}`, { headers }),
      ]);

      if ([deviceRes, latestRes].some((res) => res.status === 401)) {
        clearAuthSession();
        throw new Error("Your session expired. Please log in again.");
      }

      if (!deviceRes.ok) {
        throw new Error(`Failed to fetch device info (${deviceRes.status})`);
      }

      const deviceData = await deviceRes.json();
      setDevice(deviceData);
      setNameInput(deviceData.name || deviceData.deviceId);

      if (latestRes.ok) {
        setLatest(await latestRes.json());
      }
    } catch (err) {
      setError(err.message);
    }
  }, [deviceId]);

  const fetchHistory = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const selectedRange = HISTORY_TIME_RANGES.find((range) => range.value === selectedTimeRange) || HISTORY_TIME_RANGES[2];

      const recentRes = await fetch(
        `${API_BASE_URL}/telemetry/recent/${deviceId}?limit=${selectedRange.sampleLimit}&hours=${selectedRange.value}`,
        { headers }
      );

      if (recentRes.status === 401) {
        clearAuthSession();
        throw new Error("Your session expired. Please log in again.");
      }

      if (!recentRes.ok) {
        throw new Error(`Failed to fetch telemetry history (${recentRes.status})`);
      }

      const {
        readings,
        averages: avgs,
        totalCount,
        sampledCount,
      } = await recentRes.json();

      setHistory(readings || []);
      setAverages(avgs || {});
      setHistorySummary({
        totalCount: totalCount || 0,
        sampledCount: sampledCount || 0,
      });
    } catch (err) {
      setError(err.message);
    }
  }, [deviceId, selectedTimeRange]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        await Promise.all([fetchDeviceSnapshot(), fetchHistory()]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [fetchDeviceSnapshot, fetchHistory]);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    const id = setInterval(fetchDeviceSnapshot, 10_000);
    return () => clearInterval(id);
  }, [fetchDeviceSnapshot, loading]);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    const id = setInterval(fetchHistory, 10_000);
    return () => clearInterval(id);
  }, [fetchHistory, loading]);

  const handleRename = async () => {
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
        method: "PATCH",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ name: nameInput }),
      });

      if (res.status === 401) {
        clearAuthSession();
        throw new Error("Your session expired. Please log in again.");
      }

      if (!res.ok) {
        throw new Error("Failed to rename");
      }

      setDevice(await res.json());
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const readings = latest?.readings || {};
  const sensorKeys = Object.keys(readings).filter((k) => readings[k] !== null && readings[k] !== undefined);

  const availableHistorySensorKeys = useMemo(
    () => getAvailableSensorKeys(readings, history),
    [readings, history]
  );

  const sensorOptions = useMemo(
    () => [
      { value: "all", label: "All Sensors" },
      ...availableHistorySensorKeys.map((sensorKey) => ({
        value: sensorKey,
        label: SENSORS[sensorKey]?.label || sensorKey,
      })),
    ],
    [availableHistorySensorKeys]
  );

  useEffect(() => {
    if (selectedSensor !== "all" && !availableHistorySensorKeys.includes(selectedSensor)) {
      setSelectedSensor("all");
    }
  }, [availableHistorySensorKeys, selectedSensor]);

  const visibleHistorySensorKeys = selectedSensor === "all"
    ? availableHistorySensorKeys
    : availableHistorySensorKeys.filter((sensorKey) => sensorKey === selectedSensor);

  const filteredHistory = selectedSensor === "all"
    ? history
    : history.filter((reading) => reading.readings?.[selectedSensor] !== null && reading.readings?.[selectedSensor] !== undefined);

  const selectedTimeRangeLabel =
    HISTORY_TIME_RANGES.find((range) => range.value === selectedTimeRange)?.label || "Last 24 Hours";

  const historyCountLabel = selectedSensor === "all"
    ? `${historySummary.totalCount || history.length} samples in ${selectedTimeRangeLabel.toLowerCase()}`
    : `${filteredHistory.length} matching samples`;

  if (loading) {
    return (
      <div className="ddp-loading">
        <div className="ddp-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ddp-error">
        <p>⚠ {error}</p>
        <Link to="/devices" className="ddp-back">← Back to devices</Link>
      </div>
    );
  }

  return (
    <div className="ddp-page">
      <div className="ddp-header">
        <Link to="/devices" className="ddp-back">← Devices</Link>

        <div className="ddp-title-row">
          {editing ? (
            <div className="ddp-rename-row">
              <input
                className="ddp-rename-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
              <button className="ddp-btn ddp-btn--save" onClick={handleRename} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="ddp-btn ddp-btn--cancel" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="ddp-name-row">
              <h1 className="ddp-name">{device?.name || device?.deviceId}</h1>
              <button className="ddp-btn ddp-btn--ghost" onClick={() => setEditing(true)}>
                Rename
              </button>
            </div>
          )}

          <div className="ddp-meta">
            <span className={`ddp-dot ${device?.online ? "ddp-dot--on" : ""}`} />
            <span>{device?.online ? "Online" : "Offline"}</span>
            <span className="ddp-sep">·</span>
            <span className="ddp-meta-id">{device?.deviceId}</span>
            <span className="ddp-sep">·</span>
            <span>Last seen {timeAgo(device?.lastTelemetryAt)}</span>
          </div>
        </div>

        <div className="ddp-tabs">
          <button
            className={`ddp-tab ${tab === "overview" ? "ddp-tab--active" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            className={`ddp-tab ${tab === "history" ? "ddp-tab--active" : ""}`}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>
      </div>

      {tab === "overview" && (
        <div className="ddp-section">
          <p className="ddp-section-label">Current Readings</p>
          {sensorKeys.length === 0 ? (
            <p className="ddp-empty">No telemetry received yet.</p>
          ) : (
            <div className="ddp-readings-grid">
              {sensorKeys.map((k) => (
                <ReadingCard key={k} sensorKey={k} value={readings[k]} avg={averages[k]} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="ddp-section">
          <div className="ddp-history-header">
            <div>
              <p className="ddp-section-label">Telemetry History</p>
              <span className="ddp-history-count">{historyCountLabel}</span>
            </div>

            <div className="ddp-history-toolbar">
              <TimeRangePicker
                value={selectedTimeRange}
                onChange={setSelectedTimeRange}
                options={HISTORY_TIME_RANGES}
                id="device-history-range"
              />
              <SensorSelect
                value={selectedSensor}
                onChange={setSelectedSensor}
                options={sensorOptions}
                id="device-history-sensor"
              />
            </div>
          </div>
          {filteredHistory.length === 0 || visibleHistorySensorKeys.length === 0 ? (
            <p className="ddp-empty">No telemetry matches the selected filters.</p>
          ) : (
            <div className="ddp-charts-grid">
              {visibleHistorySensorKeys.map((k) => (
                <SensorChart key={k} sensorKey={k} data={filteredHistory} avg={averages[k]} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}