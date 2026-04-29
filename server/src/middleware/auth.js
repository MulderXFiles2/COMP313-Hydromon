/**
 * auth.js
 *
 * Authentication middleware for protecting API routes.
 * Validates JWT tokens and attaches user context to requests.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}