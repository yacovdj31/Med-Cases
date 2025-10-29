// server/routes/boxes.js
import express from 'express';
import path from 'path';
import Box, { ALLOWED_COUNTRIES } from '../models/Box.js';
import Upload from '../models/Upload.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

/* ---------------- helpers ---------------- */
function assertCountry(value) {
  if (!ALLOWED_COUNTRIES.includes(value)) {
    const err = new Error('country must be USA, Russia, or Canada');
    err.status = 400;
    throw err;
  }
}

function normalizePhotoFileId(body = {}) {
  if (body.photoClear) return '__CLEAR__';
  const cands = [
    body.photoFileId, body.photoId, body.imageId, body.imageFileId, body.coverFileId,
    body.photo, body.image, body?.photoObj?._id, body?.imageObj?._id, body?.image?._id,
  ];
  for (const c of cands) {
    if (!c) continue;
    if (typeof c === 'string') return c;
    if (typeof c === 'object' && c._id) return String(c._id);
  }
  return null;
}

async function countryTotalWeight(country, excludeBoxId = null) {
  const match = { country };
  if (excludeBoxId) match._id = { $ne: excludeBoxId };
  const agg = await Box.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$weight' } } },
  ]);
  return agg.length ? agg[0].total : 0;
}

/* ---------------- routes ---------------- */

/** USER: active boxes for their country */
router.get('/', auth(), async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('country');
    const boxes = await Box.find({ country: me.country, active: true }).sort({ key: 1 });
    res.json(boxes);
  } catch (e) {
    console.error('[/api/boxes] GET / error:', e);
    res.status(500).json({ error: e.message });
  }
});

/** ADMIN: list all boxes for a given country */
router.get('/admin', auth('admin'), async (req, res) => {
  try {
    const { country } = req.query || {};
    assertCountry(country);
    const boxes = await Box.find({ country }).sort({ key: 1 });
    res.json(boxes);
  } catch (e) {
    console.error('[/api/boxes] GET /admin error:', e);
    res.status(e.status || 500).json({ error: e.message });
  }
});

/** ADMIN: create a box */
router.post('/admin', auth('admin'), async (req, res) => {
  try {
    const { country, key, title } = req.body || {};
    if (!key || !title) return res.status(400).json({ error: 'key and title required' });
    assertCountry(country);

    // weight guard
    const requested = Number.isFinite(+req.body.weight) ? Math.floor(+req.body.weight) : 0;
    const existingTotal = await countryTotalWeight(country);
    const weight = Math.max(0, Math.min(requested, 100 - existingTotal));

    // photo
    const photoId = normalizePhotoFileId(req.body);

    const box = await Box.create({
      country,
      key,
      title,
      description: req.body.description ?? '',
      contacts: Array.isArray(req.body.contacts) ? req.body.contacts : [],
      weight,
      active: typeof req.body.active === 'boolean' ? req.body.active : true,
      photoFileId: photoId && photoId !== '__CLEAR__' ? photoId : null,
    });

    if (photoId && photoId !== '__CLEAR__') {
      await Upload.updateOne({ _id: photoId }, { $set: { isPublic: true } });
    }

    req.app.get('io')?.to(country).emit('boxes:update', { country, action: 'create', boxId: box._id });
    res.json(box);
  } catch (e) {
    console.error('[/api/boxes] POST /admin error:', e);
    res.status(e.status || 500).json({ error: e.message });
  }
});

/** ADMIN: update a box */
router.put('/admin/:id', auth('admin'), async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) return res.status(404).json({ error: 'Not found' });

    const updates = {};

    if (req.body.key != null) updates.key = req.body.key;
    if (req.body.title != null) updates.title = req.body.title;
    if (req.body.description != null) updates.description = req.body.description;
    if (Array.isArray(req.body.contacts)) updates.contacts = req.body.contacts; // ✅ preserve contacts
    if (typeof req.body.active === 'boolean') updates.active = req.body.active;

    if (req.body.weight != null) {
      const newWeight = Math.max(0, Math.floor(+req.body.weight));
      const totalExcludingThis = await countryTotalWeight(box.country, box._id);
      const proposedTotal = totalExcludingThis + newWeight;
      if (proposedTotal > 100) {
        return res
          .status(400)
          .json({ error: `Total weight for ${box.country} would be ${proposedTotal}% (over 100%).` });
      }
      updates.weight = newWeight;
    }

    const photoId = normalizePhotoFileId(req.body);
    if (photoId === '__CLEAR__') {
      updates.photoFileId = null;
    } else if (photoId) {
      updates.photoFileId = photoId;
      await Upload.updateOne({ _id: photoId }, { $set: { isPublic: true } });
    }

    await Box.updateOne({ _id: box._id }, { $set: updates });
    const updated = await Box.findById(box._id);

    req.app.get('io')?.to(updated.country).emit('boxes:update', {
      country: updated.country,
      action: 'update',
      boxId: updated._id,
    });
    res.json(updated);
  } catch (e) {
    console.error('[/api/boxes] PUT /admin/:id error:', e);
    res.status(e.status || 500).json({ error: e.message });
  }
});

/** ADMIN: delete a box */
router.delete('/admin/:id', auth('admin'), async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) return res.status(404).json({ error: 'Not found' });
    await Box.deleteOne({ _id: box._id });
    req.app.get('io')?.to(box.country).emit('boxes:update', { country: box.country, action: 'delete', boxId: box._id });
    res.json({ ok: true });
  } catch (e) {
    console.error('[/api/boxes] DELETE /admin/:id error:', e);
    res.status(e.status || 500).json({ error: e.message });
  }
});

/**
 * USER/ADMIN: get one box by id
 * - Users can read active boxes in their country
 * - Users can also read INACTIVE boxes IF (and only if) the box is ASSIGNED to them
 * - Admins can read anything
 */
router.get('/:id', auth(), async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    if (!box) return res.status(404).json({ error: 'Not found' });

    if (req.user.role !== 'admin') {
      const me = await User.findById(req.user.id).select('country');
      if (!me || me.country !== box.country) return res.status(403).json({ error: 'Forbidden' });

      // If inactive, allow ONLY if this box is assigned to the user
      if (!box.active) {
        const assigned = await Progress.exists({ user: req.user.id, 'statuses.boxId': box._id });
        if (!assigned) return res.status(404).json({ error: 'Not found' });
      }
    }

    res.json(box);
  } catch (e) {
    console.error('[/api/boxes] GET /:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * USER/ADMIN: box photo passthrough
 * - Same visibility rule as above: users can fetch if active, or if inactive but assigned
 */
router.get('/:id/photo', auth(), async (req, res) => {
  try {
    const box = await Box.findById(req.params.id).lean();
    if (!box) return res.status(404).json({ error: 'Box not found' });

    if (req.user.role !== 'admin') {
      const me = await User.findById(req.user.id).select('country');
      if (!me || me.country !== box.country) return res.status(403).json({ error: 'Forbidden' });

      if (!box.active) {
        const assigned = await Progress.exists({ user: req.user.id, 'statuses.boxId': box._id });
        if (!assigned) return res.status(404).json({ error: 'Not found' });
      }
    }

    if (!box.photoFileId) return res.status(404).json({ error: 'No photo for this box' });

    const upload = await Upload.findById(box.photoFileId).lean();
    if (!upload || !upload.storagePath) return res.status(404).json({ error: 'File missing' });

    res.setHeader('Content-Type', upload.mimeType || 'application/octet-stream');
    res.sendFile(path.resolve(upload.storagePath));
  } catch (e) {
    console.error('[/api/boxes/:id/photo] error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
