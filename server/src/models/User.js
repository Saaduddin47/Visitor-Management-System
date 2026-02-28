import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '@vms/shared/src/index.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.EMPLOYEE
    },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    ssoEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

export const User = mongoose.model('User', userSchema);
