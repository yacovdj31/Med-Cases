import dotenv from 'dotenv';
dotenv.config();

const bool = (v, d = false) => {
  if (v === undefined || v === null) return d;
  const s = String(v).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
};

export const cfg = {
  // Core
  port: Number(process.env.PORT || 3001),
  mongoUrl: process.env.MONGO_URL,
  dbName: process.env.DB_NAME || 'scavenger',
  jwtSecret: process.env.JWT_SECRET || 'change-me',

  // CORS
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Uploads
  uploadDir: process.env.UPLOAD_DIR || 'uploads',

  // SMTP / Mail
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: bool(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || 'Scavenger <no-reply@example.com>',
  adminEmail: process.env.ADMIN_EMAIL || '',
};
