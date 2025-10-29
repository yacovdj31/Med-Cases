import express from "express";
import UserIntake from "../models/UserIntake.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

/**
 * GET /api/admin/intake/:userId
 * Admin only — fetch a user's intake doc
 */
router.get("/:userId", auth("admin"), async (req, res) => {
  try {
    const doc = await UserIntake.findOne({ userId: req.params.userId }).lean();
    // Consistent shape for client
    res.json(doc || { userId: req.params.userId, intake: null, createdAt: null, updatedAt: null, _id: null });
  } catch (e) {
    console.error("[admin/intake GET] error:", e);
    res.status(500).json({ error: "Failed to load intake" });
  }
});

/**
 * PUT /api/admin/intake/:userId
 * Admin only — overwrite or create intake doc (useful if admin edits)
 */
router.put("/:userId", auth("admin"), async (req, res) => {
  try {
    const { intake } = req.body || {};
    if (!intake || typeof intake !== "object") {
      return res.status(400).json({ error: "intake object is required" });
    }
    const doc = await UserIntake.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: { intake } },
      { upsert: true, new: true }
    ).lean();
    res.json(doc);
  } catch (e) {
    console.error("[admin/intake PUT] error:", e);
    res.status(500).json({ error: "Failed to save intake" });
  }
});

export default router;
