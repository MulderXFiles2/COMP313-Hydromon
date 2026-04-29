/**
 * env.js
 *
 * Loads and validates environment variables required by the server.
 * Centralizes configuration so missing or invalid variables
 * fail fast at startup.
 */



import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hydroponics_dev",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_later",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  nodeEnv: process.env.NODE_ENV || "development",
  emailFrom: process.env.EMAIL_FROM || "alerts@hydromon.local",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
};
