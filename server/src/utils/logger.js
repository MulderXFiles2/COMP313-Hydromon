/**
 * logger.js
 *
 * Centralized logging utility for the backend.
 * Provides consistent log formatting and log levels
 * across the application.
 */


export const logger = {
  info: (...args) => console.log("[INFO]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
};
