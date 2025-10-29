// server/src/routes/progress.js
import express from 'express';
import mongoose from 'mongoose';
import { auth } from '../middlewares/auth.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import Box from '../models/Box.js';

const router = express.Router();

/* ----------------------------- Helpers ----------------------------- */

const isValidObjectId = (v) => mongoose.isValidObjectId(String(v || ''));

function hasProp(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

// Normalize inbound boxId: accepts string | ObjectId | { _id: string } | any object w/ _id
function normalizeBoxId(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (isValidObjectId(raw)) return String(raw);
  if (typeof raw === 'object' && raw._id) return String(raw._id);
  return null;
}

// Normalize inbound state values:
// - accepts: null | 'pending' | 'completed' | 'void' | 'not_touched' | boolean (legacy)
// - returns: null | 'pending' | 'completed'
function normalizeState(input) {
  if (input === 'void' || input === 'not_touched') return null;
  if (input === 'pending' || input === 'completed') return input;
  if (input === null) return null;
  if (typeof input === 'boolean') return input ? 'completed' : null; // legacy
  return null;
}

function emitProgress(io, userId) {
  try {
    io?.to(String(userId))?.emit('progress:update', { userId });
    io?.emit('admin:progress:update', { userId });
  } catch {}
}

function explainAndThrow(status, message, details = undefined) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  throw err;
}

/* ------------------------------ Reads ------------------------------ */

/** Get current user's progress */
router.get('/me', auth(), async (req, res) => {
  try {
    const doc = await Progress.findOne({ user: req.user.id })
      .populate({ path: 'statuses.boxId', model: 'Box' })
      .lean();
    res.json(doc || { user: req.user.id, statuses: [] });
  } catch (e) {
    console.error('[/progress/me] error:', e);
    res.status(500).json({ error: e.message });
  }
});

/** Admin: get a specific user's progress */
router.get('/user/:userId', auth('admin'), async (req, res) => {
  try {
    const doc = await Progress.findOne({ user: req.params.userId })
      .populate({ path: 'statuses.boxId', model: 'Box' })
      .lean();
    res.json(doc || { user: req.params.userId, statuses: [] });
  } catch (e) {
    console.error('[/progress/user/:userId] error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* --------------------------- Bulk assign --------------------------- */
/**
 * Admin: assign a set of boxes (REPLACES the assignment) for the user.
 * Request body:
 *   { userId, assignments?: [{ boxId, state }], boxIds?: [id, ...] }
 * - If assignments missing but boxIds provided, defaults state to null for each (neutral).
 * - Preserves the array ORDER as the assignment order.
 */
router.post('/assign', auth('admin'), async (req, res) => {
  try {
    const { userId } = req.body || {};
    let { assignments, boxIds } = req.body || {};

    if (!userId) explainAndThrow(400, 'userId required');

    // Build assignments from boxIds if needed
    if (!Array.isArray(assignments) && Array.isArray(boxIds)) {
      assignments = boxIds.map((raw) => ({ boxId: normalizeBoxId(raw), state: null }));
    }
    if (!Array.isArray(assignments)) assignments = [];

    // Normalize each assignment
    assignments = assignments.map((a, i) => {
      const id = normalizeBoxId(a?.boxId);
      const st = normalizeState(a?.state);
      if (!id) {
        explainAndThrow(400, 'Invalid boxId in assignments', { index: i, got: a?.boxId });
      }
      return { boxId: id, state: st };
    });

    // Remove duplicates while preserving order
    const seen = new Set();
    assignments = assignments.filter((a) => {
      const key = String(a.boxId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Validate user
    const user = await User.findById(userId).select('country');
    if (!user) explainAndThrow(404, 'User not found');

    const ids = assignments.map((a) => a.boxId);
    if (ids.length === 0) {
      // Clear all assignments
      const cleared = await Progress.findOneAndUpdate(
        { user: userId },
        { $set: { statuses: [] } },
        { new: true, upsert: true }
      )
        .populate({ path: 'statuses.boxId', model: 'Box' })
        .lean();
      emitProgress(req.app.get('io'), userId);
      return res.json(cleared);
    }

    // Validate all IDs: correct format
    const badIds = ids.filter((id) => !isValidObjectId(id));
    if (badIds.length) {
      explainAndThrow(400, 'One or more boxIds are not valid ObjectIds', { badIds });
    }

    // Validate boxes existence and same country
    const boxes = await Box.find({ _id: { $in: ids } }).select('_id country active').lean();
    if (boxes.length !== ids.length) {
      // find which are missing
      const found = new Set(boxes.map((b) => String(b._id)));
      const missing = ids.filter((id) => !found.has(String(id)));
      explainAndThrow(400, 'One or more boxes not found', { missing });
    }
    if (boxes.some((b) => b.country !== user.country)) {
      explainAndThrow(400, 'All boxes must match the user’s country');
    }

    // Preserve assignedAt for already-assigned boxes
    const existing = await Progress.findOne({ user: userId }).lean();
    const assignedAtMap = new Map(
      (existing?.statuses || []).map((s) => [String(s.boxId), s.assignedAt ? new Date(s.assignedAt) : new Date()])
    );

    const now = new Date();
    const statuses = assignments.map((a) => {
      const key = String(a.boxId);
      const st = normalizeState(a.state);
      return {
        boxId: key,
        state: st,
        completed: st === 'completed',
        assignedAt: assignedAtMap.get(key) || now,
      };
    });

    const updated = await Progress.findOneAndUpdate(
      { user: userId },
      { $set: { statuses } },
      { new: true, upsert: true }
    )
      .populate({ path: 'statuses.boxId', model: 'Box' })
      .lean();

    emitProgress(req.app.get('io'), userId);
    res.json(updated);
  } catch (e) {
    const status = e.status || 500;
    const payload = e.details ? { error: e.message, details: e.details } : { error: e.message };
    if (status >= 500) console.error('[/progress/assign] error:', e);
    res.status(status).json(payload);
  }
});

/* ------------------------- Admin: set state ------------------------ */
router.patch('/user/:userId/status', auth('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const rawBoxId = hasProp(req.body, 'boxId') ? req.body.boxId : null;
    const boxId = normalizeBoxId(rawBoxId);
    const hasState = hasProp(req.body, 'state');
    const hasCompleted = hasProp(req.body, 'completed');

    if (!boxId || (!hasState && !hasCompleted)) {
      explainAndThrow(400, 'boxId and (state|null) or completed(boolean) required');
    }
    if (!isValidObjectId(boxId)) explainAndThrow(400, 'Invalid boxId');

    const user = await User.findById(userId).select('country');
    if (!user) explainAndThrow(404, 'User not found');

    const box = await Box.findById(boxId).select('country');
    if (!box) explainAndThrow(404, 'Box not found');
    if (box.country !== user.country) explainAndThrow(400, 'Box country must match user’s country');

    const prog = await Progress.findOne({ user: userId });
    if (!prog) explainAndThrow(404, 'Progress not found');

    const idx = prog.statuses.findIndex((s) => String(s.boxId) === String(boxId));
    if (idx === -1) explainAndThrow(404, 'Box not assigned');

    if (hasState) {
      const state = normalizeState(req.body.state);
      prog.statuses[idx].state = state;
      prog.statuses[idx].completed = state === 'completed';
    } else {
      const completed = !!req.body.completed;
      prog.statuses[idx].completed = completed;
      prog.statuses[idx].state = completed ? 'completed' : null;
    }

    await prog.save();
    emitProgress(req.app.get('io'), userId);
    res.json({ ok: true });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error('[/progress/user/:userId/status] error:', e);
    res.status(status).json({ error: e.message, details: e.details });
  }
});

/* -------------------------- User: set state ------------------------ */
router.patch('/me/status', auth(), async (req, res) => {
  try {
    const rawBoxId = hasProp(req.body, 'boxId') ? req.body.boxId : null;
    const boxId = normalizeBoxId(rawBoxId);
    const hasState = hasProp(req.body, 'state');
    const hasCompleted = hasProp(req.body, 'completed');

    if (!boxId || (!hasState && !hasCompleted)) {
      explainAndThrow(400, 'boxId and (state|null) or completed(boolean) required');
    }
    if (!isValidObjectId(boxId)) explainAndThrow(400, 'Invalid boxId');

    const me = await User.findById(req.user.id).select('country');
    const box = await Box.findById(boxId).select('country active');
    if (!box || !box.active || box.country !== me.country) {
      explainAndThrow(400, 'Invalid box for this user');
    }

    const prog = await Progress.findOne({ user: req.user.id });
    if (!prog) explainAndThrow(404, 'Progress not found');

    const idx = prog.statuses.findIndex((s) => String(s.boxId) === String(boxId));
    if (idx === -1) explainAndThrow(404, 'Box not assigned');

    if (hasState) {
      const state = normalizeState(req.body.state);
      prog.statuses[idx].state = state;
      prog.statuses[idx].completed = state === 'completed';
    } else {
      const completed = !!req.body.completed;
      prog.statuses[idx].completed = completed;
      prog.statuses[idx].state = completed ? 'completed' : null;
    }

    await prog.save();

    emitProgress(req.app.get('io'), req.user.id);
    res.json({ ok: true });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error('[/progress/me/status] error:', e);
    res.status(status).json({ error: e.message, details: e.details });
  }
});

export default router;
