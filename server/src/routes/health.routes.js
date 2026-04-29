/**
 * health.routes.js
 *
 * Health check routes for service monitoring.
 * Used by orchestration tools or uptime monitors
 * to verify the API is running and responsive.
 */


import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ ok: true, service: "hydroponics-api", time: new Date().toISOString() });
});

export default router;
