// server/models/Box.js
import mongoose from 'mongoose';

export const ALLOWED_COUNTRIES = ['USA', 'Russia', 'Canada'];

/** Lightweight contact entry attached to a box */
const contactSchema = new mongoose.Schema(
  {
    name:        { type: String, default: '' },
    phone:       { type: String, default: '' },
    email:       { type: String, default: '' },
    description: { type: String, default: '' }, // notes/role/etc
  },
  { _id: false } // we don't need an _id per contact
);

const boxSchema = new mongoose.Schema(
  {
    country: { type: String, enum: ALLOWED_COUNTRIES, required: true },
    key:      { type: String, required: true },
    title:    { type: String, required: true },
    description: { type: String, default: '' },

    /** Multiple contacts per box */
    contacts: { type: [contactSchema], default: [] },

    weight: { type: Number, default: 0, min: 0, max: 100 },
    active: { type: Boolean, default: true },

    /** Cover image stored as Upload _id */
    photoFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', default: null },
  },
  { timestamps: true }
);

boxSchema.index({ country: 1, key: 1 }, { unique: true });

export default mongoose.model('Box', boxSchema);
