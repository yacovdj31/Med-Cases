import mongoose from 'mongoose';

const StatusSchema = new mongoose.Schema({
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true },
  completed: { type: Boolean, default: false },
}, { _id: false });

const UserProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  statuses: { type: [StatusSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('UserProgress', UserProgressSchema);