/**
 * auth.routes.js
 *
 * Express routes for registration, login, logout,
 * and authenticated user lookup.
 */

import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
} from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", auth, me);
router.post("/logout", logout);

export default router;