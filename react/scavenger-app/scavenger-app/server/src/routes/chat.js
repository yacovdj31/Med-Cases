import express from 'express';
import Message from '../models/Message.js';
import { auth } from '../middlewares/auth.js';


const router = express.Router();


// Fetch recent messages for a user's thread (admin can pass ?userId=)
router.get('/', auth(), async (req, res) => {
const userId = req.user.role === 'admin' ? (req.query.userId) : req.user.id;
const msgs = await Message.find({ userId }).sort({ createdAt: 1 }).limit(500);
res.json(msgs);
});


export default router;