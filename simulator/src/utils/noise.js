/**
 * noise.js
 *
 * Utility functions for adding realism to simulated sensor readings.
 * Provides helpers for jitter, drift, clamping ranges, and smoothing.
 *
 * Keeps generators simple by centralizing common “signal shaping” logic.
 */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

/**
 * Returns a random value between -magnitude and +magnitude.
 */
function randomOffset(magnitude) {
  return (Math.random() * 2 - 1) * magnitude;
}

/**
 * Applies a one-step random jitter around the current value.
 */
function applyJitter(currentValue, magnitude) {
  return currentValue + randomOffset(magnitude);
}

/**
 * Applies a steady directional drift.
 * Example: current + 0.01 each cycle.
 */
function applyDrift(currentValue, driftPerStep = 0) {
  return currentValue + driftPerStep;
}

/**
 * Applies drift and jitter together, then clamps and rounds.
 */
function applySignal({
  currentValue,
  jitter = 0,
  drift = 0,
  min = -Infinity,
  max = Infinity,
  decimals = 2
}) {
  let nextValue = currentValue;

  nextValue = applyDrift(nextValue, drift);
  nextValue = applyJitter(nextValue, jitter);
  nextValue = clamp(nextValue, min, max);

  return round(nextValue, decimals);
}

/**
 * Simple smoothing toward a target value.
 * Useful when you want a value to slowly trend toward a baseline.
 */
function moveToward(currentValue, targetValue, stepSize = 0.1) {
  if (currentValue < targetValue) {
    return Math.min(currentValue + stepSize, targetValue);
  }

  if (currentValue > targetValue) {
    return Math.max(currentValue - stepSize, targetValue);
  }

  return currentValue;
}

module.exports = {
  clamp,
  round,
  randomOffset,
  applyJitter,
  applyDrift,
  applySignal,
  moveToward
};