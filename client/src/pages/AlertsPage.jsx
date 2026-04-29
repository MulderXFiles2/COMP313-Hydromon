import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders, getCurrentUser } from "../api/auth.api";
import "./AlertsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SENSOR_OPTIONS = [
  { value: "all", label: "All Sensors" },
  { value: "ph", label: "pH" },
  { value: "ec", label: "EC" },
  { value: "waterTempC", label: "Water Temp" },
  { value: "airTempC", label: "Air Temp" },
  { value: "humidityPct", label: "Humidity" },
  { value: "co2ppm", label: "CO2" },
  { value: "par", label: "PAR" },
  { value: "waterLevelPct", label: "Water Level" },
  { value: "flowRateLpm", label: "Flow Rate" },
  { value: "orpMv", label: "ORP" },
  { value: "dissolvedOxygenMgL", label: "Dissolved Oxygen" },
];

const TIME_RANGE_OPTIONS = [
  { value: "24", label: "Last 24 Hours" },
  { value: "72", label: "Last 3 Days" },
  { value: "168", label: "Last 7 Days" },
  { value: "720", label: "Last 30 Days" },
];

function createInitialAlertForm(defaultRecipient = "") {
  return {
    deviceId: "",
    sensorType: "ph",
    operator: "gt",
    threshold: "",
    severity: "warning",
    message: "",
    scheduleType: "daily",
    time: "08:00",
    dayOfWeek: 1,
    date: "",
    title: "",
    description: "",
    emailEnabled: Boolean(defaultRecipient),
    emailRecipients: defaultRecipient,
  };
}

function toRecipientArray(value) {
  return String(value || "")
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function formatAlertTarget(alert) {
  if (alert.ruleType === "threshold") {
    return `${alert.sensorType} ${alert.operator} ${alert.threshold}`;
  }

  if (alert.scheduleType === "daily") {
    return `Daily @ ${alert.time}`;
  }

  if (alert.scheduleType === "weekly") {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return `Weekly (${days[Number(alert.dayOfWeek)] ?? alert.dayOfWeek}) @ ${alert.time}`;
  }

  if (alert.date) {
    return `Once @ ${new Date(alert.date).toLocaleString()}`;
  }

  return "Scheduled";
}

export default function AlertsPage() {
  const currentUserEmail = getCurrentUser()?.email || "";
  const [alerts, setAlerts] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [alertType, setAlertType] = useState("threshold");
  const [alertForm, setAlertForm] = useState(() => createInitialAlertForm(currentUserEmail));
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertError, setAlertError] = useState("");

  async function refreshAlerts() {
    const params = new URLSearchParams();

    if (selectedType !== "all") {
      params.set("ruleType", selectedType);
    }

    if (selectedStatus !== "all") {
      params.set("active", selectedStatus);
    }

    const res = await fetch(`${API_BASE_URL}/alerts?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    const body = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error(body.error || "Failed to refresh alerts");
    }

    setAlerts(Array.isArray(body) ? body : []);
  }

  useEffect(() => {
    let ignore = false;

    async function loadAlerts() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (selectedType !== "all") {
          params.set("ruleType", selectedType);
        }

        if (selectedStatus !== "all") {
          params.set("active", selectedStatus);
        }

        const res = await fetch(`${API_BASE_URL}/alerts?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        const body = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(body.error || "Failed to load alerts");
        }

        if (!ignore) {
          setAlerts(Array.isArray(body) ? body : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setAlerts([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      ignore = true;
    };
  }, [selectedType, selectedStatus]);

  const activeCount = useMemo(
    () => alerts.filter((alert) => alert.active).length,
    [alerts]
  );

  const inactiveCount = useMemo(
    () => alerts.filter((alert) => !alert.active).length,
    [alerts]
  );

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [alerts]);

  function resetAlertForm() {
    setAlertForm(createInitialAlertForm(currentUserEmail));
    setAlertType("threshold");
    setAlertError("");
  }

  function closeAlertPanel() {
    setShowAlertPanel(false);
    resetAlertForm();
  }

  async function handleToggleAlert(alert) {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${alert._id}`, {
        method: "PATCH",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          active: !alert.active,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Failed to update alert");
      }

      await refreshAlerts();
    } catch (err) {
      setAlertError(err.message);
    }
  }

  async function handleDeleteAlert(alertId) {
    const confirmed = window.confirm("Delete this alert?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Failed to delete alert");
      }

      await refreshAlerts();
    } catch (err) {
      setAlertError(err.message);
    }
  }

  async function handleCreateAlert(e) {
    e.preventDefault();
    setSavingAlert(true);
    setAlertError("");

    try {
      const payload =
        alertType === "threshold"
          ? {
              deviceId: alertForm.deviceId.trim(),
              ruleType: "threshold",
              sensorType: alertForm.sensorType,
              operator: alertForm.operator,
              threshold: Number(alertForm.threshold),
              severity: alertForm.severity,
              message: alertForm.message.trim(),
              description: alertForm.description.trim(),
              emailEnabled: alertForm.emailEnabled,
              emailRecipients: alertForm.emailEnabled
                ? toRecipientArray(alertForm.emailRecipients)
                : [],
              active: true,
            }
          : {
              deviceId: alertForm.deviceId.trim(),
              ruleType: "scheduled",
              scheduleType: alertForm.scheduleType,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              time:
                alertForm.scheduleType === "daily" ||
                alertForm.scheduleType === "weekly"
                  ? alertForm.time
                  : null,
              dayOfWeek:
                alertForm.scheduleType === "weekly"
                  ? Number(alertForm.dayOfWeek)
                  : null,
              date:
                alertForm.scheduleType === "once" && alertForm.date
                  ? new Date(alertForm.date).toISOString()
                  : null,
              severity: alertForm.severity,
              message: alertForm.title.trim() || alertForm.message.trim(),
              description: alertForm.description.trim(),
              emailEnabled: alertForm.emailEnabled,
              emailRecipients: alertForm.emailEnabled
                ? toRecipientArray(alertForm.emailRecipients)
                : [],
              active: true,
            };

      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Failed to create alert");
      }

      closeAlertPanel();
      await refreshAlerts();
    } catch (err) {
      setAlertError(err.message);
    } finally {
      setSavingAlert(false);
    }
  }

  return (
    <div className="alerts-page">
      <div className="alerts-header-row">
        <div>
          <h1 className="alerts-title">Alerts Dashboard</h1>
          <p className="alerts-subtitle">
            Create and manage scheduled and threshold alerts.
          </p>
        </div>

        <button
          className="alerts-add-btn"
          onClick={() => setShowAlertPanel(true)}
          type="button"
        >
          + Add Alert
        </button>
      </div>

      <div className="alerts-filters">
        <div className="alerts-filter-group">
          <label className="alerts-label">Type</label>
          <select
            className="alerts-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Alerts</option>
            <option value="threshold">Threshold</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        <div className="alerts-filter-group">
          <label className="alerts-label">Status</label>
          <select
            className="alerts-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="alerts-summary">
        <div className="alerts-card">
          <h3 className="alerts-number">{alerts.length}</h3>
          <p className="alerts-label-small">Total Alerts</p>
        </div>

        <div className="alerts-card">
          <h3 className="alerts-number alerts-number-active">{activeCount}</h3>
          <p className="alerts-label-small">Active Alerts</p>
        </div>

        <div className="alerts-card">
          <h3 className="alerts-number alerts-number-resolved">{inactiveCount}</h3>
          <p className="alerts-label-small">Inactive Alerts</p>
        </div>
      </div>

      {loading ? (
        <div className="alerts-empty">Loading alerts...</div>
      ) : error ? (
        <div className="alerts-empty">⚠ {error}</div>
      ) : sortedAlerts.length === 0 ? (
        <div className="alerts-empty">No alerts found for the selected filters.</div>
      ) : (
        <div className="alerts-table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th className="alerts-th">Type</th>
                <th className="alerts-th">Device</th>
                <th className="alerts-th">Target</th>
                <th className="alerts-th">Message</th>
                <th className="alerts-th">Severity</th>
                <th className="alerts-th">Status</th>
                <th className="alerts-th">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedAlerts.map((alert) => (
                <tr
                  key={alert._id}
                  className={alert.active ? "alerts-row-normal" : "alerts-row-inactive"}
                >
                  <td className="alerts-td">{alert.ruleType}</td>
                  <td className="alerts-td">{alert.deviceId || "—"}</td>
                  <td className="alerts-td">{formatAlertTarget(alert)}</td>
                  <td className="alerts-td">{alert.message || "—"}</td>
                  <td className="alerts-td">{alert.severity || "warning"}</td>
                  <td className="alerts-td">
                    <span
                      className={
                        alert.active
                          ? "alerts-badge alerts-badge-resolved"
                          : "alerts-badge alerts-badge-default"
                      }
                    >
                      {alert.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="alerts-td">
                    <div className="alerts-action-row">
                      <Link
                        className="alerts-link-btn"
                        to={`/alerts/${alert._id}`}
                      >
                        Details
                      </Link>

                      <button
                        type="button"
                        className="alerts-inline-btn"
                        onClick={() => handleToggleAlert(alert)}
                      >
                        {alert.active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        className="alerts-inline-btn alerts-inline-btn-danger"
                        onClick={() => handleDeleteAlert(alert._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAlertPanel && (
        <div className="alerts-panel-overlay" onClick={closeAlertPanel}>
          <div className="alerts-panel" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-panel-header">
              <h2>Create Alert</h2>
              <button
                className="alerts-panel-close"
                onClick={closeAlertPanel}
                type="button"
              >
                ✕
              </button>
            </div>

            <form className="alerts-rule-form" onSubmit={handleCreateAlert}>
              {alertError && (
                <div className="alerts-form-error">⚠ {alertError}</div>
              )}

              <div className="alerts-toggle-row">
                <button
                  type="button"
                  className={
                    alertType === "threshold"
                      ? "alerts-toggle active"
                      : "alerts-toggle"
                  }
                  onClick={() => setAlertType("threshold")}
                >
                  Threshold
                </button>
                <button
                  type="button"
                  className={
                    alertType === "scheduled"
                      ? "alerts-toggle active"
                      : "alerts-toggle"
                  }
                  onClick={() => setAlertType("scheduled")}
                >
                  Scheduled
                </button>
              </div>

              <div className="alerts-form-group">
                <label className="alerts-label">Device ID</label>
                <input
                  className="alerts-input"
                  value={alertForm.deviceId}
                  onChange={(e) =>
                    setAlertForm((prev) => ({
                      ...prev,
                      deviceId: e.target.value,
                    }))
                  }
                  placeholder="tent-1"
                  required
                />
              </div>

              {alertType === "threshold" ? (
                <>
                  <div className="alerts-form-group">
                    <label className="alerts-label">Sensor Type</label>
                    <select
                      className="alerts-select"
                      value={alertForm.sensorType}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          sensorType: e.target.value,
                        }))
                      }
                    >
                      {SENSOR_OPTIONS.filter((s) => s.value !== "all").map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="alerts-form-group">
                    <label className="alerts-label">Operator</label>
                    <select
                      className="alerts-select"
                      value={alertForm.operator}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          operator: e.target.value,
                        }))
                      }
                    >
                      <option value="gt">Greater than</option>
                      <option value="gte">Greater than or equal</option>
                      <option value="lt">Less than</option>
                      <option value="lte">Less than or equal</option>
                      <option value="eq">Equal</option>
                    </select>
                  </div>

                  <div className="alerts-form-group">
                    <label className="alerts-label">Threshold</label>
                    <input
                      className="alerts-input"
                      type="number"
                      step="any"
                      value={alertForm.threshold}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          threshold: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="alerts-form-group">
                    <label className="alerts-label">Severity</label>
                    <select
                      className="alerts-select"
                      value={alertForm.severity}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          severity: e.target.value,
                        }))
                      }
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="alerts-form-group">
                    <label className="alerts-label">Message</label>
                    <input
                      className="alerts-input"
                      value={alertForm.message}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="pH too high"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="alerts-form-group">
                    <label className="alerts-label">Title</label>
                    <input
                      className="alerts-input"
                      value={alertForm.title}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Daily nutrient check"
                      required
                    />
                  </div>

                  <div className="alerts-form-group">
                    <label className="alerts-label">Description</label>
                    <textarea
                      className="alerts-textarea"
                      value={alertForm.description}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Optional notes for the operator"
                    />
                  </div>

                  <div className="alerts-form-group">
                    <label className="alerts-label">Schedule Type</label>
                    <select
                      className="alerts-select"
                      value={alertForm.scheduleType}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          scheduleType: e.target.value,
                        }))
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="once">One Time</option>
                    </select>
                  </div>

                  {(alertForm.scheduleType === "daily" ||
                    alertForm.scheduleType === "weekly") && (
                    <div className="alerts-form-group">
                      <label className="alerts-label">Time</label>
                      <input
                        className="alerts-input"
                        type="time"
                        value={alertForm.time}
                        onChange={(e) =>
                          setAlertForm((prev) => ({
                            ...prev,
                            time: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  )}

                  {alertForm.scheduleType === "weekly" && (
                    <div className="alerts-form-group">
                      <label className="alerts-label">Day of Week</label>
                      <select
                        className="alerts-select"
                        value={alertForm.dayOfWeek}
                        onChange={(e) =>
                          setAlertForm((prev) => ({
                            ...prev,
                            dayOfWeek: e.target.value,
                          }))
                        }
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                  )}

                  {alertForm.scheduleType === "once" && (
                    <div className="alerts-form-group">
                      <label className="alerts-label">Date & Time</label>
                      <input
                        className="alerts-input"
                        type="datetime-local"
                        value={alertForm.date}
                        onChange={(e) =>
                          setAlertForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  )}

                  <div className="alerts-form-group">
                    <label className="alerts-label">Severity</label>
                    <select
                      className="alerts-select"
                      value={alertForm.severity}
                      onChange={(e) =>
                        setAlertForm((prev) => ({
                          ...prev,
                          severity: e.target.value,
                        }))
                      }
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </>
              )}

              <div className="alerts-form-group">
                <label className="alerts-checkbox-row">
                  <input
                    type="checkbox"
                    checked={alertForm.emailEnabled}
                    onChange={(e) =>
                      setAlertForm((prev) => ({
                        ...prev,
                        emailEnabled: e.target.checked,
                        emailRecipients:
                          e.target.checked && !prev.emailRecipients
                            ? currentUserEmail
                            : prev.emailRecipients,
                      }))
                    }
                  />
                  Send email notifications for this alert
                </label>
              </div>

              {alertForm.emailEnabled && (
                <div className="alerts-form-group">
                  <label className="alerts-label">Email Recipients</label>
                  <input
                    className="alerts-input"
                    value={alertForm.emailRecipients}
                    onChange={(e) =>
                      setAlertForm((prev) => ({
                        ...prev,
                        emailRecipients: e.target.value,
                      }))
                    }
                    placeholder="operator@example.com, grower@example.com"
                    required
                  />
                  <p className="alerts-delivery-hint">
                    Use comma-separated email addresses. Your account email is used by default.
                  </p>
                </div>
              )}

              <div className="alerts-form-actions">
                <button
                  type="button"
                  className="alerts-secondary-btn"
                  onClick={closeAlertPanel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="alerts-primary-btn"
                  disabled={savingAlert}
                >
                  {savingAlert ? "Saving..." : "Create Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}