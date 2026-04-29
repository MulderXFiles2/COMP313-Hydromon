/**
 * auth.controller.js
 *
 * HTTP handlers for authentication endpoints.
 */

import * as authService from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.json({ message: "Logged out successfully" });
}