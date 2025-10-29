import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
  {
    boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
    // Tri-state: null (not touched), 'pending', 'completed'
    state: { type: String, enum: ['pending', 'completed', null], default: null },
    // Legacy flag kept for back-compat; we keep it in sync with 'state'
    completed: { type: Boolean, default: false },
    assignedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    // ORDER MATTERS: array order == assigned order
    statuses: { type: [statusSchema], default: [] },
  },
  { timestamps: true }
);

// (Optional) This index often isn’t needed; if it ever causes issues, remove it.
// progressSchema.index({ user: 1, 'statuses.boxId': 1 });

export default mongoose.model('Progress', progressSchema);
