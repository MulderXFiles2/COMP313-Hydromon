import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import { logger } from "./utils/logger.js";
import * as alertsService from "./services/alerts.service.js";

async function start() {
  await connectMongo();

  const app = createApp();

  logger.info("Running initial scheduled alert evaluation");
  await alertsService.evaluateScheduledAlerts().catch((err) => {
    logger.error("Initial scheduled alert evaluation failed", {
      error: err.message || String(err),
    });
  });

  const scheduledAlertsInterval = setInterval(async () => {
    try {
      logger.info("Running scheduled alert interval tick");
      await alertsService.evaluateScheduledAlerts();
    } catch (err) {
      logger.error("Scheduled alert evaluation failed", {
        error: err.message || String(err),
      });
    }
  }, 60 * 1000);

  app.listen(env.port, () => {
    logger.info(`API running on http://localhost:${env.port}`);
  });

  const shutdown = (signal) => {
    logger.warn(`Received ${signal}. Shutting down API...`);
    clearInterval(scheduledAlertsInterval);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  logger.error("Fatal startup error", {
    error: err.message || String(err),
  });
  process.exit(1);
});