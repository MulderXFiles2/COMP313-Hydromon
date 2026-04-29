import React, { useEffect, useRef, useState } from "react";
import { getAuthHeaders } from "../../api/auth.api";
import "./AlertToastHost.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const POLL_MS = 5000;

function formatTimestamp(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return "";
  }
}

export default function AlertToastHost() {
  const [toasts, setToasts] = useState([]);
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    async function pollTriggeredAlerts() {
      try {
        const res = await fetch(`${API_BASE_URL}/alerts/live`, {
          headers: getAuthHeaders(),
        });

        const body = await res.json().catch(() => []);

        if (!res.ok || !Array.isArray(body) || cancelled) {
          return;
        }

        for (const alert of body) {
          if (!alert?._id || seenIdsRef.current.has(alert._id)) {
            continue;
          }

          seenIdsRef.current.add(alert._id);

          setToasts((prev) => [
            ...prev,
            {
              _id: alert._id,
              title: alert.message || "Alert triggered",
              severity: alert.severity || "warning",
              deviceId: alert.deviceId || "",
              sensorType: alert.sensorType || "",
              createdAt: alert.createdAt || new Date().toISOString(),
            },
          ]);

          timersRef.current.set(alert._id, timerId);
        }
      } catch {
        // quiet for now
      }
    }

    pollTriggeredAlerts();
    const intervalId = window.setInterval(pollTriggeredAlerts, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);

    };
  }, []);

    function dismissToast(id) {
    setToasts((prev) => prev.filter((item) => item._id !== id));
    }

  return (
    <div className="alert-toast-host" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast._id}
          className={`alert-toast alert-toast-${toast.severity}`}
          role="status"
        >
          <div className="alert-toast-header">
            <strong className="alert-toast-title">{toast.title}</strong>
            <button
              type="button"
              className="alert-toast-close"
              onClick={() => dismissToast(toast._id)}
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>

          <div className="alert-toast-meta">
            {toast.deviceId ? <span>Device: {toast.deviceId}</span> : null}
            {toast.sensorType ? <span>Sensor: {toast.sensorType}</span> : null}
            <span>{formatTimestamp(toast.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}