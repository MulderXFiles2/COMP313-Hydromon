/**
 * alerts.routes.js
 *
 * Express routes for user-managed alerts.
 * Supports scheduled alerts and threshold alerts.
 */

import { Router } from "express";
import {
  listAlerts,
  listLiveAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
} from "../controllers/alerts.controller.js";
import { auth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createAlertSchema, updateAlertSchema } from "../schemas/alert.schema.js";

const router = Router();

router.get("/", auth, listAlerts);
router.get("/live", auth, listLiveAlerts);
router.get("/:id", auth, getAlertById);
router.post("/", auth, validateBody(createAlertSchema), createAlert);
router.patch("/:id", auth, validateBody(updateAlertSchema), updateAlert);
router.delete("/:id", auth, deleteAlert);

export default router;