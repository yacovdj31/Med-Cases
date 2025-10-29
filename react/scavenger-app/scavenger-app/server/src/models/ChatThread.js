import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true },
    lastUserReadAt: { type: Date, default: null },   // when this user last opened/read the thread
    lastAdminReadAt: { type: Date, default: null },  // when an admin last viewed this user's thread
  },
  { timestamps: true }
);

export default mongoose.model('ChatThread', chatThreadSchema);
