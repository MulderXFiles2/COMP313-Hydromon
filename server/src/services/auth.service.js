/**
 * auth.service.js
 *
 * Authentication business logic for registering users,
 * logging users in, and reading the currently authenticated user.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toPublicUser(user) {
  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export async function registerUser({ userName, email, password }) {
  const normalizedUserName = userName.trim();
  const normalizedEmail = email.toLowerCase().trim();

  const [existingEmailUser, existingUserNameUser] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    User.findOne({ userName: new RegExp(`^${escapeRegex(normalizedUserName)}$`, "i") }),
  ]);

  if (existingEmailUser) {
    throw createHttpError(409, "An account with that email already exists");
  }

  if (existingUserNameUser) {
    throw createHttpError(409, "That username is already taken");
  }

  const user = await User.create({
    userName: normalizedUserName,
    email: normalizedEmail,
    password,
    role: "operator",
  });

  return {
    token: signToken(user),
    user: toPublicUser(user),
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const isValid = await user.comparePassword(password);

  if (!isValid) {
    throw createHttpError(401, "Invalid credentials");
  }

  return {
    token: signToken(user),
    user: toPublicUser(user),
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return toPublicUser(user);
}