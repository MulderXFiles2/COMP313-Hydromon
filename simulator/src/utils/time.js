/**
 * time.js
 *
 * Time-related helpers for the simulator.
 * Includes utilities for timestamp creation and scheduling support.
 *
 * Ensures all simulated telemetry includes consistent ISO timestamps.
 */
/**
 * time.js
 *
 * Time-related helpers for the simulator.
 * Includes utilities for timestamp creation and scheduling support.
 *
 * Ensures all simulated telemetry includes consistent ISO timestamps.
 */

function getIsoTimestamp() {
  return new Date().toISOString();
}

function getNowMs() {
  return Date.now();
}

function secondsToMs(seconds) {
  return seconds * 1000;
}

function minutesToMs(minutes) {
  return minutes * 60 * 1000;
}

module.exports = {
  getIsoTimestamp,
  getNowMs,
  secondsToMs,
  minutesToMs
};