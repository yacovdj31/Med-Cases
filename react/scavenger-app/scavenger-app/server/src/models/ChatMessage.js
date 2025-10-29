// server/src/models/ChatMessage.js
import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },

    // match what the frontend reads: m.from.role === 'admin' | 'user'
    from: {
      role: { type: String, enum: ['admin', 'user'], required: true },
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    text: { type: String, required: true },
    kind: { type: String, enum: ['text', 'system'], default: 'text' },

    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ thread: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
