/**
 * app.js
 *
 * Express application configuration.
 * Sets up middleware, routes, and global error handling.
 *
 * This file defines the Express app but does not start the HTTP server.
 */


import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import devicesRoutes from "./routes/devices.routes.js";
import telemetryRoutes from "./routes/telemetry.routes.js";
import alertsRoutes from "./routes/alerts.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  const allowedOrigins = new Set([
    "https://comp-313-hydroponic-monitoring-syst.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ]);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      ok: true,
      service: "hydroponics-api",
      message: "API is running",
      health: "/health",
    });
  });

  app.use("/auth", authRoutes);
  app.use("/health", healthRoutes);
  app.use("/devices", devicesRoutes);
  app.use("/alerts", alertsRoutes);
  app.use("/telemetry", telemetryRoutes);

  app.use(errorHandler);

  return app;
}
