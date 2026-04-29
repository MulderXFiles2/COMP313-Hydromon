import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AddDevicePage.css";
import { getAuthHeaders } from "../api/auth.api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AddDevicePage() {
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/devices`, {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          deviceId: deviceId.trim(),
          name: name.trim() || deviceId.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add device");
      }
      const device = await res.json();
      navigate(`/devices/${device.deviceId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adp-page">
      <Link to="/devices" className="adp-back">← Devices</Link>

      <div className="adp-card">
        <h1 className="adp-title">Add Device</h1>
        <p className="adp-subtitle">Register a new device to start collecting telemetry.</p>

        {error && <div className="adp-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="adp-form">
          <div className="adp-field">
            <label className="adp-label">
              Device ID <span className="adp-required">*</span>
            </label>
            <input
              className="adp-input"
              placeholder="e.g. tent-1"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
              autoFocus
            />
            <span className="adp-hint">Must match the ID configured on the physical device</span>
          </div>

          <div className="adp-field">
            <label className="adp-label">Display Name</label>
            <input
              className="adp-input"
              placeholder="e.g. Grow Tent – Bay 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="adp-hint">Optional — defaults to Device ID if blank</span>
          </div>

          <button
            type="submit"
            className="adp-submit"
            disabled={submitting || !deviceId.trim()}
          >
            {submitting ? "Adding…" : "Add Device"}
          </button>
        </form>
      </div>
    </div>
  );
}