/**
 * MetricsGrid.jsx
 *
 * Layout component that arranges multiple MetricCard components
 * into a responsive grid.
 *
 * Responsible only for structure — not data fetching.
 */

import MetricCard from "./MetricCard";
import "./MetricsGrid.css";

function MetricsGrid({ metrics = {} }) {
  const flattenedMetrics = Object.entries(metrics).flatMap(([deviceId, deviceMetrics]) =>
    (deviceMetrics || []).map((metric, index) => ({
      ...metric,
      _cardKey: `${deviceId}-${index}`
    }))
  );

  return (
    <div className="container">
      <div className="metrics-grid">
        {flattenedMetrics.map((metric) => (
          <MetricCard key={metric._cardKey} {...metric} />
        ))}
      </div>
    </div>
  );
}

export default MetricsGrid;