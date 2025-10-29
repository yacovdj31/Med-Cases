// server/src/routes/adminChat.js
import express from 'express';
import { auth } from '../middlewares/auth.js';
import User from '../models/User.js';
import Thread from '../models/Thread.js';
import ChatMessage from '../models/ChatMessage.js';

const router = express.Router();

async function getAdmin() {
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('Admin user not found');
  return admin;
}

async function getOrCreateThreadFor(userId) {
  const admin = await getAdmin();
  let thr = await Thread.findOne({ 'participants.0': admin._id, 'participants.1': userId });
  if (!thr) {
    thr = await Thread.create({
      participants: [admin._id, userId],
      lastMessageAt: null,
      unreadForAdmin: 0,
      unreadForUser: 0,
      lastAdminReadAt: null,
      lastUserReadAt: null,
    });
  }
  return thr;
}

/** GET /api/admin/chat/thread/:userId */
router.get('/thread/:userId', auth('admin'), async (req, res) => {
  const { userId } = req.params;
  const thr = await getOrCreateThreadFor(userId);
  const messages = await ChatMessage.find({ thread: thr._id }).sort({ createdAt: 1 }).lean();
  res.json({ messages });
});

/** POST /api/admin/chat/thread/:userId — admin sends message */
router.post('/thread/:userId', auth('admin'), async (req, res) => {
  const { userId } = req.params;
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Text required' });

  const admin = await getAdmin();
  const thr = await getOrCreateThreadFor(userId);

  const msg = await ChatMessage.create({
    thread: thr._id,
    from: { role: 'admin', id: admin._id },
    text,
    kind: 'text',
  });

  await Thread.updateOne(
    { _id: thr._id },
    { $set: { lastMessageAt: msg.createdAt }, $inc: { unreadForUser: 1 } }
  );

  // notify user room if you use sockets
  req.app.get('io')?.to(String(userId)).emit('user:chat:update', { userId });

  res.json({ ok: true, message: msg });
});

/** GET /api/admin/chat/unread/:userId — user→admin since admin last read */
router.get('/unread/:userId', auth('admin'), async (req, res) => {
  const { userId } = req.params;
  const thr = await getOrCreateThreadFor(userId);
  const last = thr?.lastAdminReadAt || new Date(0);

  const unread = await ChatMessage.countDocuments({
    thread: thr._id,
    'from.role': 'user',
    createdAt: { $gt: last },
  });

  res.json({ unread });
});

/** POST /api/admin/chat/mark-read/:userId */
router.post('/mark-read/:userId', auth('admin'), async (req, res) => {
  const { userId } = req.params;
  const thr = await getOrCreateThreadFor(userId);

  await Thread.updateOne(
    { _id: thr._id },
    { $set: { lastAdminReadAt: new Date(), unreadForAdmin: 0 } }
  );

  res.json({ ok: true });
});

export default router;
