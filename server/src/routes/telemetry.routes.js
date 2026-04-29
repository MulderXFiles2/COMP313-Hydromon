/**
 * telemetry.routes.js
 */

import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  createTelemetry,
  latestTelemetry,
  recentTelemetry
} from "../controllers/telemetry.controller.js";
import { validateBody } from "../middleware/validate.js";
import { createTelemetrySchema } from "../schemas/telemetry.schema.js";

const router = Router();

router.post("/", validateBody(createTelemetrySchema), createTelemetry);
router.get("/latest/:deviceId", auth, latestTelemetry);
router.get("/recent/:deviceId", auth, recentTelemetry);   // ← new: history + averages

export default router;