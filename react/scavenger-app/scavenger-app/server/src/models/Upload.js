import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // If null => "Other" bucket (not tied to a specific Box)
    boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', default: null, index: true },

    // File metadata
    originalName: { type: String, required: true },
    filename:     { type: String, required: true }, // stored filename on disk
    mimeType:     { type: String, required: true },
    size:         { type: Number, required: true },

    // Where the file is saved (local path)
    storagePath:  { type: String, required: true },

    // If true, any authenticated user who can see the related Box may view this
    // (used for box cover photos, etc.)
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Upload', uploadSchema);
