// server/src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { cfg } from '../config.js';
import User from '../models/User.js';
import { auth } from '../middlewares/auth.js';

import Thread from '../models/Thread.js';
import ChatMessage from '../models/ChatMessage.js';
import UserIntake from '../models/UserIntake.js'; // <-- uses your intake model

const router = express.Router();

/* ----------------------------- helpers ----------------------------- */
const CANON = ['USA', 'Canada', 'Russia'];

function normalizeCountry(input) {
  const v = String(input || '').trim();
  const u = v.toUpperCase();
  const map = {
    US: 'USA',
    USA: 'USA',
    'UNITED STATES': 'USA',
    'UNITED STATES OF AMERICA': 'USA',
    CA: 'Canada',
    CANADA: 'Canada',
    RU: 'Russia',
    RUS: 'Russia',
    RUSSIA: 'Russia',
    'RUSSIAN FEDERATION': 'Russia',
  };
  // If it's one of our mapped synonyms, return the canonical name; otherwise keep original
  return map[u] ?? v;
}

function signJWT(u) {
  return jwt.sign(
    { id: u._id, email: u.email, role: u.role, name: u.name, country: u.country },
    cfg.jwtSecret,
    { expiresIn: '7d' }
  );
}

async function getAdmin() {
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('Admin user not found');
  return admin;
}

async function getOrCreateThread(adminId, userId) {
  let thr = await Thread.findOne({ 'participants.0': adminId, 'participants.1': userId });
  if (!thr) {
    thr = await Thread.create({
      participants: [adminId, userId],
      lastMessageAt: null,
      unreadForAdmin: 0,
      unreadForUser: 0,
      lastAdminReadAt: null,
      lastUserReadAt: null,
    });
  }
  return thr;
}

// Escape string for use inside RegExp
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ------------------------------ routes ----------------------------- */

/** POST /api/auth/signup
 * Accepts either flat fields or intake wizard payload:
 *  - body: { email, password, name, country, intake? }
 *  - if name or country are missing, tries: intake.personal.fullName / intake.personal.country
 *  - saves intake (if provided) into UserIntake { userId, intake }
 */
router.post('/signup', async (req, res) => {
  try {
    let { email, password, name, country, intake, info } = req.body || {};
    // Support both `intake` and legacy `info`
    if (!intake && info && typeof info === 'object') intake = info;

    const emailTrim = String(email || '').trim();
    const emailLower = emailTrim.toLowerCase();

    // Fill from intake when missing
    if (!name && intake?.personal?.fullName) name = intake.personal.fullName;
    if (!country && intake?.personal?.country) country = intake.personal.country;

    if (!emailTrim || !password || !country) {
      return res.status(400).json({ error: 'email, password and country required' });
    }

    // Canonicalize country; enforce allowed list
    country = normalizeCountry(country);
    if (!CANON.includes(country)) {
      return res.status(400).json({ error: 'country must be USA, Canada, or Russia' });
    }

    // Case-insensitive duplicate check (no reliance on extra schema fields)
    const exists = await User.findOne({
      email: new RegExp(`^${escapeRegex(emailTrim)}$`, 'i'),
    });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    // Create user — store email in lowercase to avoid future ambiguity
    const hashed = bcrypt.hashSync(password, 10);
    const user = await User.create({
      email: emailLower, // stored lowercased
      password: hashed,
      name: String(name || '').trim(),
      country,
      role: 'user',
      lastLoginAt: null,
      welcomeSentAt: null,
    });

    // Save intake (non-fatal if shape varies)
    if (intake && typeof intake === 'object') {
      try {
        await UserIntake.create({ userId: user._id, intake });
      } catch (e) {
        console.warn('[AUTH /signup] UserIntake save warning:', e.message);
      }
    }

    // Optional welcome message/thread
    try {
      const admin = await getAdmin();
      const thr = await getOrCreateThread(admin._id, user._id);
      const msg = await ChatMessage.create({
        thread: thr._id,
        from: { role: 'admin', id: admin._id },
        text: `Hello ${user.name || user.email}, welcome!`,
        kind: 'system',
      });
      await Thread.updateOne(
        { _id: thr._id },
        { $set: { lastMessageAt: msg.createdAt }, $inc: { unreadForUser: 1 } }
      );
      user.welcomeSentAt = new Date();
      await user.save();
    } catch (e) {
      console.warn('[AUTH /signup] welcome flow error:', e.message);
    }

    const token = signJWT(user);
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, name: user.name, country: user.country },
    });
  } catch (e) {
    console.error('[AUTH /signup] error:', e);
    res.status(500).json({ error: e.message || 'Signup failed' });
  }
});

/** POST /api/auth/login
 * Body: { email, password }
 * Looks up email case-insensitively; keeps the same welcome-thread logic.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailTrim = String(email || '').trim();
    if (!emailTrim || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = await User.findOne({
      email: new RegExp(`^${escapeRegex(emailTrim)}$`, 'i'),
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(500).json({ error: 'User record invalid (missing password)' });

    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Ensure welcome sent + thread exists
    try {
      if (user.role !== 'admin') {
        const admin = await getAdmin();
        const thr = await getOrCreateThread(admin._id, user._id);

        if (!user.welcomeSentAt) {
          const msg = await ChatMessage.create({
            thread: thr._id,
            from: { role: 'admin', id: admin._id },
            text: `Hello ${user.name || user.email}, welcome!`,
            kind: 'system',
          });
          await Thread.updateOne(
            { _id: thr._id },
            { $set: { lastMessageAt: msg.createdAt }, $inc: { unreadForUser: 1 } }
          );
          user.welcomeSentAt = new Date();
          await user.save();
        }
      }
    } catch (e) {
      console.warn('[AUTH /login] thread/welcome error:', e.message);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signJWT(user);
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, name: user.name, country: user.country },
    });
  } catch (e) {
    console.error('[AUTH /login] error:', e);
    res.status(500).json({ error: e.message || 'Login failed' });
  }
});

/** GET /api/auth/me */
router.get('/me', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (e) {
    console.error('[AUTH /me] error:', e);
    res.status(500).json({ error: e.message || 'Failed to load user' });
  }
});

/** GET /api/auth/admin/users (admin-only) */
router.get('/admin/users', auth('admin'), async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    console.error('[AUTH /admin/users] error:', e);
    res.status(500).json({ error: e.message || 'Failed to load users' });
  }
});

export default router;
