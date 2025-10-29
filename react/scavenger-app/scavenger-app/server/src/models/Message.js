// server/src/models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    from: {
      role: { type: String, enum: ['user', 'admin'], required: true },
      id: { type: mongoose.Schema.Types.ObjectId }, // optional
    },
    text: { type: String, required: true },
    readByUser: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
