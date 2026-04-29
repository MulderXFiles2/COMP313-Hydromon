import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAuthHeaders, getCurrentUser } from "../api/auth.api";
import "./AlertDetailsPage.css";

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

function toRecipientArray(value) {
  return String(value || "")
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

export default function AlertRuleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserEmail = getCurrentUser()?.email || "";

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAlert() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
          headers: getAuthHeaders(),
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body.error || "Failed to load alert");
        }

        if (!ignore) {
          setForm({
            deviceId: body.deviceId || "",
            ruleType: body.ruleType || "threshold",
            sensorType: body.sensorType || "ph",
            operator: body.operator || "gt",
            threshold: body.threshold ?? "",
            severity: body.severity || "warning",
            message: body.message || "",
            description: body.description || "",
            scheduleType: body.scheduleType || "daily",
            timeZone: body.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            time: body.time || "08:00",
            dayOfWeek: body.dayOfWeek ?? 1,
            date: body.date
              ? new Date(body.date).toISOString().slice(0, 16)
              : "",
            emailEnabled: body.emailEnabled ?? Boolean(currentUserEmail),
            emailRecipients:
              Array.isArray(body.emailRecipients) && body.emailRecipients.length > 0
                ? body.emailRecipients.join(", ")
                : body.createdByEmail || currentUserEmail,
            active: body.active ?? true,
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAlert();

    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload =
        form.ruleType === "threshold"
          ? {
              deviceId: form.deviceId.trim(),
              ruleType: "threshold",
              sensorType: form.sensorType,
              operator: form.operator,
              threshold: Number(form.threshold),
              severity: form.severity,
              message: form.message.trim(),
              description: form.description.trim(),
              emailEnabled: form.emailEnabled,
              emailRecipients: form.emailEnabled ? toRecipientArray(form.emailRecipients) : [],
              active: form.active,
            }
          : {
              deviceId: form.deviceId.trim(),
              ruleType: "scheduled",
              scheduleType: form.scheduleType,
              timeZone: form.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              time:
                form.scheduleType === "daily" || form.scheduleType === "weekly"
                  ? form.time
                  : null,
              dayOfWeek:
                form.scheduleType === "weekly"
                  ? Number(form.dayOfWeek)
                  : null,
              date:
                form.scheduleType === "once" && form.date
                  ? new Date(form.date).toISOString()
                  : null,
              severity: form.severity,
              message: form.message.trim(),
              description: form.description.trim(),
              emailEnabled: form.emailEnabled,
              emailRecipients: form.emailEnabled ? toRecipientArray(form.emailRecipients) : [],
              active: form.active,
            };

      const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Failed to update alert");
      }

      navigate("/alerts");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this alert?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Failed to delete alert");
      }

      navigate("/alerts");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="ardp">Loading alert...</div>;
  }

  if (error && !form) {
    return <div className="ardp">⚠ {error}</div>;
  }

  return (
    <div className="ardp">
      <Link to="/alerts" className="ardp-back">
        ← Back to Alerts
      </Link>
      <h1 className="ardp-title">Alert Details</h1>

      {error && <div className="ardp-error">⚠ {error}</div>}

      {form && (
        <form className="ardp-form" onSubmit={handleSave}>
          <label className="ardp-label">Device ID</label>
          <input
            className="ardp-input"
            value={form.deviceId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deviceId: e.target.value }))
            }
          />

          <label className="ardp-label">Alert Type</label>
          <select
            className="ardp-input"
            value={form.ruleType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, ruleType: e.target.value }))
            }
          >
            <option value="threshold">Threshold</option>
            <option value="scheduled">Scheduled</option>
          </select>

          {form.ruleType === "threshold" ? (
            <>
              <label className="ardp-label">Sensor Type</label>
              <select
                className="ardp-input"
                value={form.sensorType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sensorType: e.target.value }))
                }
              >
                {SENSOR_OPTIONS.filter((s) => s.value !== "all").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="ardp-label">Operator</label>
              <select
                className="ardp-input"
                value={form.operator}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, operator: e.target.value }))
                }
              >
                <option value="gt">Greater than</option>
                <option value="gte">Greater than or equal</option>
                <option value="lt">Less than</option>
                <option value="lte">Less than or equal</option>
                <option value="eq">Equal</option>
              </select>

              <label className="ardp-label">Threshold</label>
              <input
                className="ardp-input"
                type="number"
                step="any"
                value={form.threshold}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, threshold: e.target.value }))
                }
              />
            </>
          ) : (
            <>
              <label className="ardp-label">Schedule Type</label>
              <select
                className="ardp-input"
                value={form.scheduleType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, scheduleType: e.target.value }))
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="once">One Time</option>
              </select>

              {(form.scheduleType === "daily" ||
                form.scheduleType === "weekly") && (
                <>
                  <label className="ardp-label">Time</label>
                  <input
                    className="ardp-input"
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, time: e.target.value }))
                    }
                  />
                </>
              )}

              {form.scheduleType === "weekly" && (
                <>
                  <label className="ardp-label">Day of Week</label>
                  <select
                    className="ardp-input"
                    value={form.dayOfWeek}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
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
                </>
              )}

              {form.scheduleType === "once" && (
                <>
                  <label className="ardp-label">Date & Time</label>
                  <input
                    className="ardp-input"
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </>
              )}
            </>
          )}

          <label className="ardp-label">Severity</label>
          <select
            className="ardp-input"
            value={form.severity}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, severity: e.target.value }))
            }
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <label className="ardp-label">Message / Title</label>
          <input
            className="ardp-input"
            value={form.message}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, message: e.target.value }))
            }
          />

          <label className="ardp-label">Description</label>
          <textarea
            className="ardp-textarea"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <label className="ardp-checkbox-row">
            <input
              type="checkbox"
              checked={form.emailEnabled}
              onChange={(e) =>
                setForm((prev) => ({
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

          {form.emailEnabled && (
            <>
              <label className="ardp-label">Email Recipients</label>
              <input
                className="ardp-input"
                value={form.emailRecipients}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, emailRecipients: e.target.value }))
                }
                placeholder="operator@example.com, grower@example.com"
              />
              <p className="ardp-delivery-hint">
                Use comma-separated email addresses. Your account email is used by default.
              </p>
            </>
          )}

          <label className="ardp-checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
            />
            Active
          </label>

          <div className="ardp-actions">
            <button className="ardp-save" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button className="ardp-delete" type="button" onClick={handleDelete}>
              Delete Alert
            </button>
          </div>
        </form>
      )}
    </div>
  );
}