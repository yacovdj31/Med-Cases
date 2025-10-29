import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    // case-insensitive uniqueness helper
    emailLower: { type: String, index: true, unique: true, sparse: true },

    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    name: String,
    country: { type: String, enum: ['USA', 'Russia', 'Canada'], required: true },

    lastLoginAt: { type: Date, default: null },
    welcomeSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  if (this.isModified('email') || this.isNew) {
    this.emailLower = String(this.email || '').trim().toLowerCase();
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
