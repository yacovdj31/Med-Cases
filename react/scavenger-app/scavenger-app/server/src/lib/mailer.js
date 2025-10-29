// server/src/lib/mailer.js
import { cfg } from '../config.js';

let transporter = null;

async function ensureTransporter() {
  if (!cfg.smtpHost) return null;
  if (transporter) return transporter;

  const nodemailer = await import('nodemailer');
  transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: Number(cfg.smtpPort || 587),
    secure: cfg.smtpSecure === true || String(cfg.smtpSecure) === 'true',
    auth: cfg.smtpUser && cfg.smtpPass ? { user: cfg.smtpUser, pass: cfg.smtpPass } : undefined,
  });
  console.log(`[mailer] SMTP ready: ${cfg.smtpHost}:${cfg.smtpPort} secure=${String(cfg.smtpSecure)}`);
  return transporter;
}

export async function sendMail({ to, subject, html, attachments }) {
  const tx = await ensureTransporter();
  if (!tx) {
    console.log(`[mailer NO-OP] Would send to ${Array.isArray(to) ? to.join(', ') : to}: "${subject}" (attachments: ${attachments?.length || 0})`);
    return { mocked: true };
  }
  const info = await tx.sendMail({
    from: cfg.mailFrom || 'no-reply@example.com',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    attachments, // array of { filename, path, contentType, cid? }
  });
  console.log(`[mailer] sent messageId=${info.messageId} to=${Array.isArray(to) ? to.join(', ') : to} attachments=${attachments?.length || 0}`);
  return info;
}
