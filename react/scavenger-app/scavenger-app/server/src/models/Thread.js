// server/src/models/Thread.js
import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema(
  {
    // participants[0] is adminId, participants[1] is userId
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    lastMessageAt: { type: Date, default: null },

    // unread counters
    unreadForAdmin: { type: Number, default: 0 },
    unreadForUser: { type: Number, default: 0 },

    // last read timestamps
    lastAdminReadAt: { type: Date, default: null },
    lastUserReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

threadSchema.index({ 'participants.0': 1, 'participants.1': 1 }, { unique: true });

export default mongoose.model('Thread', threadSchema);
