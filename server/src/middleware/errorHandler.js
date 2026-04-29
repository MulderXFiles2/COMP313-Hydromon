/**
 * errorHandler.js
 *
 * Global Express error-handling middleware.
 * Converts thrown errors into consistent HTTP responses.
 *
 * Ensures errors are logged and never leak internal details to clients.
 */


import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error(err);

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Server error",
  });
}
