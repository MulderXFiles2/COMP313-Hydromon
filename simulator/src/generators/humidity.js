/**
 * humidity.js
 *
 * Sensor value generator for relative humidity (%).
 * Simulates natural fluctuations and gradual changes over time.
 *
 * Used for testing environmental monitoring and stale-data detection.
 */
function generateHumidity(current) {
  const drift = (Math.random() - 0.5) * 1.5;
  let next = current + drift;

  if (next < 40) next = 40;
  if (next > 75) next = 75;

  return Number(next.toFixed(1));
}

module.exports = generateHumidity;