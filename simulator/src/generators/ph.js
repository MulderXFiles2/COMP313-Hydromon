/**
 * ph.js
 *
 * Sensor value generator for pH.
 * Produces realistic pH behavior (slow drift + small noise).
 *
 * Intended to mimic real hydroponic pH patterns for monitoring and alert tests.
 */
const { applySignal } = require("../utils/noise");

function generatePh(current) {
  return applySignal({
    currentValue: current,
    jitter: 0.03,
    drift: 0,
    min: 5.5,
    max: 7.0,
    decimals: 2
  });
}

module.exports = generatePh;