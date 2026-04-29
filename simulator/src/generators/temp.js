/**
 * temp.js
 *
 * Sensor value generator for temperature readings.
 * Can be used for water temperature, air temperature, or both depending on scenario.
 *
 * Designed to simulate slow environmental changes rather than rapid jitter.
 */
function generateTemp(current) {
  const drift = (Math.random() - 0.5) * 0.2;
  let next = current + drift;

  if (next < 17) next = 17;
  if (next > 25) next = 25;

  return Number(next.toFixed(2));
}

module.exports = generateTemp;