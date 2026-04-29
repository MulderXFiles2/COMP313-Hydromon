import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let cachedTransporter = null;

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.emailFrom);
}

function getTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  if (!cachedTransporter) {
    const auth = env.smtpUser
      ? {
          user: env.smtpUser,
          pass: env.smtpPass,
        }
      : undefined;

    cachedTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      family: 4,
      auth,
    });
  }

  return cachedTransporter;
}

export function emailDeliveryConfigured() {
  return hasSmtpConfig();
}

export async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    const message = "SMTP transport is not configured. Set SMTP_HOST and EMAIL_FROM to enable email delivery.";

    logger.warn(message, { recipient: to, subject });

    return {
      status: "skipped",
      transport: "smtp",
      errorMessage: message,
      messageId: "",
      deliveredAt: null,
    };
  }

  const info = await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    text,
    html,
  });

  return {
    status: "sent",
    transport: "smtp",
    errorMessage: "",
    messageId: info.messageId || "",
    deliveredAt: new Date(),
  };
}