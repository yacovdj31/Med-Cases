import express from 'express';
import mongoose from 'mongoose';
import { auth } from '../middlewares/auth.js';

const InfoSchema = new mongoose.Schema(
  {
    boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true, index: true },
    country: { type: String, required: true, index: true },
    title: String,
    content: String, // markdown/plain text
    links: [{ label: String, url: String }],
    contacts: [{ type: { type: String }, value: String }], // phone/email etc.
  },
  { timestamps: true }
);

const InfoPage = mongoose.models.InfoPage || mongoose.model('InfoPage', InfoSchema);
const router = express.Router();

/**
 * GET /api/info?boxId=...&country=...
 * Any authed user can fetch content for their box+country
 */
router.get('/', auth(), async (req, res) => {
  try {
    const { boxId, country } = req.query || {};
    if (!boxId || !country) return res.status(400).json({ error: 'boxId and country are required' });
    const info = await InfoPage.findOne({ boxId, country }).lean();
    res.json(info || null);
  } catch (e) {
    console.error('[info GET] error:', e);
    res.status(500).json({ error: 'Failed to load info page' });
  }
});

/**
 * Admin CRUD
 */

// Create
router.post('/', auth('admin'), async (req, res) => {
  try {
    const item = await InfoPage.create(req.body);
    res.json(item);
  } catch (e) {
    console.error('[info POST] error:', e);
    res.status(500).json({ error: 'Failed to create info page' });
  }
});

// Update
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const item = await InfoPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (e) {
    console.error('[info PUT] error:', e);
    res.status(500).json({ error: 'Failed to update info page' });
  }
});

// List
router.get('/list/all', auth('admin'), async (_req, res) => {
  try {
    const items = await InfoPage.find().sort({ updatedAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    console.error('[info LIST] error:', e);
    res.status(500).json({ error: 'Failed to list info pages' });
  }
});

export default router;
