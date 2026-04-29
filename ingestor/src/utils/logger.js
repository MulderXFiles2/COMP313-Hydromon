/**
 * logger.js
 *
 * Centralized logging utility for the ingestion service.
 * Provides consistent log formatting and log levels
 * for ingestion-related operations.
 */

const LEVELS = ['debug', 'info', 'warn', 'error'];

function shouldLog(currentLevel, messageLevel) {
  const c = LEVELS.indexOf(currentLevel);
  const m = LEVELS.indexOf(messageLevel);
  if (c === -1 || m === -1) return true;
  return m >= c;
}

const currentLevel = process.env.LOG_LEVEL || 'info';

function log(level, message, meta) {
  if (!shouldLog(currentLevel, level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    message
  };

  if (meta && typeof meta === 'object') entry.meta = meta;

  // Keep it simple: JSON logs are easy to parse
  console.log(JSON.stringify(entry));
}

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta)
};
