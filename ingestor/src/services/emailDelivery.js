const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let cachedTransporter = null;

function getTransporter() {
  const smtpHost = process.env.SMTP_HOST || '';
  const emailFrom = process.env.EMAIL_FROM || '';

  if (!smtpHost || !emailFrom) {
    return null;
  }

  if (!cachedTransporter) {
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      family: 4,
      auth: smtpUser
        ? {
            user: smtpUser,
            pass: smtpPass,
          }
        : undefined,
    });
  }

  return cachedTransporter;
}

async function sendEmail({ to, subject, text, html }) {
  const emailFrom = process.env.EMAIL_FROM || '';
  const transporter = getTransporter();

  if (!transporter || !emailFrom) {
    const errorMessage = 'SMTP transport is not configured. Set SMTP_HOST and EMAIL_FROM to enable email delivery.';

    logger.warn(errorMessage, { recipient: to, subject });

    return {
      status: 'skipped',
      transport: 'smtp',
      errorMessage,
      messageId: '',
      deliveredAt: null,
    };
  }

  const info = await transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    text,
    html,
  });

  return {
    status: 'sent',
    transport: 'smtp',
    errorMessage: '',
    messageId: info.messageId || '',
    deliveredAt: new Date(),
  };
}

module.exports = { sendEmail };