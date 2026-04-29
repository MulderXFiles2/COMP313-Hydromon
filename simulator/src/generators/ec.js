/**
 * ec.js
 *
 * Sensor value generator for EC/TDS (nutrient concentration).
 * Produces realistic EC behavior such as gradual drift and small fluctuations.
 *
 * Used to drive charts, trends, and alert conditions in the monitoring UI.
 */
const { applySignal } = require("../utils/noise");

function generateEc(current) {
  return applySignal({
    currentValue: current,
    jitter: 0.08,
    drift: 0,
    min: 1.2,
    max: 2.5,
    decimals: 2
  });
}

module.exports = generateEc;