import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders, clearAuthSession } from "../api/auth.api";
import "./DevicesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/devices/`, {
          headers: getAuthHeaders(),
        });

        if (res.status === 401) {
          clearAuthSession();
          throw new Error("Your session expired. Please log in again.");
        }

        if (!res.ok) {
          throw new Error("Failed to fetch devices");
        }

        setDevices(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="dp-loading"><div className="dp-spinner" /></div>;
  if (error) return <div className="dp-error">⚠ {error}</div>;

  const onlineCount = devices.filter((d) => d.online).length;

  return (
    <div className="dp-page">
      <div className="dp-header">
        <h1 className="dp-title">Devices</h1>
        <div className="dp-summary">
          <span className="dp-pill dp-pill--on">{onlineCount} online</span>
          <span className="dp-pill dp-pill--off">{devices.length - onlineCount} offline</span>
        </div>
      </div>

      <div className="dp-grid">
        {devices.map((device) => (
          <Link
            key={device._id}
            to={`/devices/${device.deviceId}`}
            className={`dp-card ${device.online ? "dp-card--on" : "dp-card--off"}`}
          >
            <div className="dp-card-top">
              <span className={`dp-dot ${device.online ? "dp-dot--on" : ""}`} />
              <span className="dp-status">{device.online ? "Online" : "Offline"}</span>
            </div>
            <div className="dp-card-name">{device.name || device.deviceId}</div>
            <div className="dp-card-id">{device.deviceId}</div>
            <div className="dp-card-seen">Last seen {timeAgo(device.lastTelemetryAt)}</div>
          </Link>
        ))}

        <Link to="/devices/add" className="dp-card dp-card--add">
          <span className="dp-add-icon">+</span>
          <span className="dp-add-label">Add Device</span>
        </Link>
      </div>
    </div>
  );
}