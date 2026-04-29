/**
 * LiveStatusBadge.jsx
 *
 * Visual indicator showing whether a device is:
 *  - online
 *  - stale (no recent data)
 *  - offline
 *
 * Helps users quickly assess data freshness and system health.
 */

import { useState, useEffect } from "react";
import "./LiveStatusBadge.css";

const STATUS_CONFIG = {
    online: { label: "Online", color: "#34d399" },
    stale: { label: "Stale", color: "#fbbf24" },
    offline: { label: "Offline", color: "#f87171" },
};

// Helper to derive the status of the device based on last seen timestamp
function deriveStatus(lastSeen, staleAfterMs = 10_000, offlineAfterMs = 30_000) {
    if (!lastSeen) return "offline";
    const age = Date.now() - lastSeen.getTime();
    if (age < staleAfterMs) return "online";
    if (age < offlineAfterMs) return "stale";
    return "offline";
}

function LiveStatusBadge({
    lastSeen = new Date(),
    staleAfterMs = 10_000,
    offlineAfterMs = 30_000,
}) {
    const [, tick] = useState(0);

    // Re-render every second to keep status current
    useEffect(() => {
        const id = setInterval(() => tick((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const status = deriveStatus(lastSeen, staleAfterMs, offlineAfterMs);
    const { label, color } = STATUS_CONFIG[status];

    return (
        <div className="badge">
            <span className="dot" style={{ backgroundColor: color }} />
            <span className="text" >{label}</span>
        </div>
    );
}

export default LiveStatusBadge;