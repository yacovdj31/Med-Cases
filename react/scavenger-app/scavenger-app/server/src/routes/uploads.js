import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { auth } from '../middlewares/auth.js';
import Upload from '../models/Upload.js';
import Progress from '../models/Progress.js';
import Box from '../models/Box.js';
import User from '../models/User.js';
import { sendMail } from '../lib/mailer.js';
import { cfg } from '../config.js';

const router = express.Router();

/* -------------------------------- setup -------------------------------- */
const UPLOAD_DIR = path.isAbsolute(cfg.uploadDir)
  ? cfg.uploadDir
  : path.join(process.cwd(), cfg.uploadDir || 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^\w.\-]+/g, '_').slice(0, 180);
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${stamp}-${safe}`);
  }
});
const upload = multer({ storage });

/* -------------------------------- utils -------------------------------- */
async function userHasBox(userId, boxId) {
  const prog = await Progress.findOne({ user: userId }, { statuses: 1 }).lean();
  if (!prog) return false;
  return prog.statuses?.some(s => String(s.boxId) === String(boxId));
}
const isValidEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
const fileLink = (id) => `${(cfg.clientOrigin || '').replace(/\/$/, '')}/api/uploads/file/${id}`;

/* --------------------------- USER: upload files -------------------------- */
router.post('/', auth(), upload.array('files', 20), async (req, res) => {
  try {
    const { boxId } = req.body || {};
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

    let resolvedBoxId = null;
    if (boxId && boxId !== 'other') {
      const box = await Box.findById(boxId).select('_id');
      if (!box) return res.status(400).json({ error: 'Invalid box' });
      const allowed = await userHasBox(req.user.id, boxId);
      if (!allowed) return res.status(400).json({ error: 'Box not assigned to this user' });
      resolvedBoxId = boxId;
    }

    const docs = await Upload.insertMany(
      files.map(f => ({
        user: req.user.id,
        boxId: resolvedBoxId,
        originalName: f.originalname,
        filename: f.filename,
        mimeType: f.mimetype,
        size: f.size,
        storagePath: path.join(UPLOAD_DIR, f.filename),
      }))
    );

    req.app.get('io')?.emit('admin:files:update', { userId: req.user.id });
    res.json({ ok: true, count: docs.length, files: docs });
  } catch (e) {
    console.error('[/uploads] error:', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/* ------------------------- USER: list own uploads ------------------------ */
router.get('/me', auth(), async (req, res) => {
  try {
    const items = await Upload.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'boxId', model: 'Box' })
      .lean();
    res.json(items);
  } catch (e) {
    console.error('[/uploads/me] error:', e);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/* --------------------- ADMIN: list uploads for user ---------------------- */
router.get('/user/:userId', auth('admin'), async (req, res) => {
  try {
    const items = await Upload.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate({ path: 'boxId', model: 'Box' })
      .lean();

    const counts = {};
    for (const it of items) {
      const key = it.boxId ? String(it.boxId._id) : 'other';
      counts[key] = (counts[key] || 0) + 1;
    }

    res.json({ items, counts });
  } catch (e) {
    console.error('[/uploads/user/:userId] error:', e);
    res.status(500).json({ error: 'Failed to list user files' });
  }
});

/* -------------------------- Serve a file (auth) -------------------------- */
router.get('/file/:id', auth(), async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id).lean();
    if (!doc) return res.status(404).end();

    const isOwner = String(doc.user) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    let allowed = isOwner || isAdmin || !!doc.isPublic;

    if (!allowed) {
      const box = await Box.findOne({ photoFileId: doc._id }).lean();
      if (box) {
        if (isAdmin) allowed = true;
        else {
          const me = await User.findById(req.user.id).select('country');
          if (me && me.country === box.country && box.active) allowed = true;
        }
      }
    }

    if (!allowed) return res.status(403).end();

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.sendFile(path.resolve(doc.storagePath));
  } catch (e) {
    console.error('[/uploads/file/:id] error:', e);
    res.status(500).end();
  }
});

/* ------------------- One-time: mark box photos public -------------------- */
router.patch('/migrate/box-photos/public', auth('admin'), async (_req, res) => {
  try {
    const boxes = await Box.find({ photoFileId: { $ne: null } }).select('photoFileId').lean();
    const ids = boxes.map(b => b.photoFileId).filter(Boolean);
    if (!ids.length) return res.json({ ok: true, updated: 0 });

    const result = await Upload.updateMany({ _id: { $in: ids } }, { $set: { isPublic: true } });
    res.json({ ok: true, updated: result.modifiedCount || 0 });
  } catch (e) {
    console.error('[migrate/box-photos/public] error:', e);
    res.status(500).json({ error: 'Migration failed' });
  }
});
router.post('/admin/send-selected', auth('admin'), async (req, res) => {
  try {
    const { userId, fileIds, to } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'No files selected' });
    }

    // recipients
    let recipients = [];
    if (Array.isArray(to)) recipients = to;
    else if (typeof to === 'string') recipients = to.split(/[,\s;]+/).map(s => s.trim()).filter(Boolean);
    recipients = Array.from(new Set(recipients));
    const valid = recipients.filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
    if (valid.length === 0) return res.status(400).json({ error: 'Enter at least one valid recipient' });

    // fetch files
    const items = await Upload.find({ _id: { $in: fileIds }, user: userId })
      .sort({ createdAt: 1 })
      .populate({ path: 'boxId', model: 'Box', select: 'key title' })
      .lean();
    if (!items.length) return res.status(404).json({ error: 'No matching files found for this user' });

    // build attachments (ensure file exists)
    const attachments = [];
    let totalBytes = 0;
    for (const it of items) {
      const absPath = path.resolve(it.storagePath);
      if (!fs.existsSync(absPath)) continue;
      const stat = fs.statSync(absPath);
      totalBytes += stat.size;

      attachments.push({
        filename: it.originalName || it.filename || `file-${String(it._id)}`,
        path: absPath,
        contentType: it.mimeType || 'application/octet-stream',
      });
    }

    // size guard (Gmail ~25MB; keep margin)
    const MAX_BYTES = 22 * 1024 * 1024; // ~22 MB
    if (totalBytes > MAX_BYTES) {
      return res.status(400).json({
        error: `Selected files are too large to email directly (~${(totalBytes/1024/1024).toFixed(1)}MB). Select fewer/smaller files.`,
      });
    }

    const subject = `Files for user ${userId} (${attachments.length})`;
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.45">
        <p>Attached: <b>${attachments.length}</b> file(s).</p>
        <p style="color:#666;font-size:12px">If previews don't show in your client, download the attachments.</p>
      </div>
    `;

    await sendMail({ to: valid, subject, html, attachments });
    return res.json({ ok: true, sent: attachments.length, to: valid });
  } catch (e) {
    console.error('[/uploads/admin/send-selected] error:', e);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
