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

async function getOrCreateThread(userId) {
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

/** GET /api/user/chat/thread — full ordered thread */
router.get('/thread', auth('user'), async (req, res) => {
  const userId = req.user.id;
  const thr = await getOrCreateThread(userId);

  const messages = await ChatMessage
    .find({ thread: thr._id })
    .sort({ createdAt: 1 })
    .lean();

  res.json({ messages });
});

/** POST /api/user/chat/thread — user sends a message */
router.post('/thread', auth('user'), async (req, res) => {
  const userId = req.user.id;
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Text required' });

  const thr = await getOrCreateThread(userId);

  const msg = await ChatMessage.create({
    thread: thr._id,
    from: { role: 'user', id: userId },
    text,
    kind: 'text',
  });

  await Thread.updateOne(
    { _id: thr._id },
    { $set: { lastMessageAt: msg.createdAt }, $inc: { unreadForAdmin: 1 } }
  );

  // --- Realtime emits ---
  const io = req.app.get('io');
  const payload = {
    userId: String(userId),
    from: 'user',
    threadId: String(thr._id),
    at: Date.now()
  };

  // notify all admins and the user room (optional)
  io?.to('admins')?.emit('chat:new', payload);
  io?.to(String(userId))?.emit('chat:new', payload);

  // keep your legacy event if something else listens to it
  io?.to(String(userId))?.emit('user:chat:update', { userId });

  res.json({ ok: true, message: msg });
});

/** GET /api/user/chat/unread — count admin→user since last read */
router.get('/unread', auth('user'), async (req, res) => {
  const userId = req.user.id;
  const thr = await getOrCreateThread(userId);
  const last = thr?.lastUserReadAt || new Date(0);

  const unread = await ChatMessage.countDocuments({
    thread: thr._id,
    'from.role': 'admin',
    createdAt: { $gt: last },
  });

  res.json({ unread });
});

/** POST /api/user/chat/mark-read — mark now, reset counter */
router.post('/mark-read', auth('user'), async (req, res) => {
  const userId = req.user.id;
  const thr = await getOrCreateThread(userId);

  await Thread.updateOne(
    { _id: thr._id },
    { $set: { lastUserReadAt: new Date(), unreadForUser: 0 } }
  );

  res.json({ ok: true });
});

export default router;
