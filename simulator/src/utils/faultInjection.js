/**
 * faultInjection.js
 *
 * Fault injection utilities for the simulator.
 * Enables simulation of real-world issues such as:
 *  - telemetry dropouts (no data for a period)
 *  - stuck sensors (flatline values)
 *  - occasional spikes/outliers
 *
 * Useful for testing alerts and dashboard robustness.
 */
/**
 * faultInjection.js
 *
 * Fault injection utilities for the simulator.
 * Enables simulation of real-world issues such as:
 *  - telemetry dropouts (no data for a period)
 *  - stuck sensors (flatline values)
 *  - occasional spikes/outliers
 *
 * Useful for testing alerts and dashboard robustness.
 */

/**
 * Returns true if the simulator should skip publishing telemetry entirely.
 */
function shouldDropTelemetry(faultConfig = {}) {
  return Boolean(faultConfig.dropTelemetry);
}

/**
 * If a sensor is marked as stuck, keep returning the stuck value.
 * Otherwise return the proposed next value.
 */
function applyStuckSensor(sensorName, currentValue, nextValue, faultConfig = {}) {
  const stuckSensors = faultConfig.stuckSensors || {};

  if (Object.prototype.hasOwnProperty.call(stuckSensors, sensorName)) {
    return stuckSensors[sensorName];
  }

  return nextValue;
}

/**
 * Occasionally injects a one-time spike into a value.
 *
 * Example config:
 * spikeSensors: {
 *   ph: { chance: 0.05, amount: 0.8 },
 *   ec: { chance: 0.03, amount: 0.5 }
 * }
 */
function applySpike(sensorName, value, faultConfig = {}) {
  const spikeSensors = faultConfig.spikeSensors || {};
  const sensorSpike = spikeSensors[sensorName];

  if (!sensorSpike) {
    return value;
  }

  const chance = sensorSpike.chance || 0;
  const amount = sensorSpike.amount || 0;

  if (Math.random() < chance) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    const spikeValue = value + direction * amount;

    console.log(`!! Fault spike injected on ${sensorName}: ${value} -> ${spikeValue} !!`);

    return spikeValue;
  }

  return value;
}

/**
 * Applies all currently supported sensor-level fault injections
 * in a predictable order.
 */
function applySensorFaults(sensorName, currentValue, nextValue, faultConfig = {}) {
  let adjustedValue = nextValue;

  adjustedValue = applyStuckSensor(sensorName, currentValue, adjustedValue, faultConfig);
  adjustedValue = applySpike(sensorName, adjustedValue, faultConfig);

  return adjustedValue;
}

module.exports = {
  shouldDropTelemetry,
  applyStuckSensor,
  applySpike,
  applySensorFaults
};