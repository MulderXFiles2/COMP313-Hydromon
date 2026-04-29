/**
 * devices.routes.js
 *
 * IMPORTANT: static routes like /add must be declared BEFORE
 * dynamic routes like /:id, otherwise Express matches "add"
 * as the :id param and the controller returns 404.
 */

import { Router } from "express";
import {
  createDevice,
  listDevices,
  getDeviceById,
  updateDevice,
} from "../controllers/devices.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.get("/", auth, listDevices);
router.post("/", auth, createDevice);
router.get("/:id", auth, getDeviceById);
router.patch("/:id", auth, updateDevice);

export default router;