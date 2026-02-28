import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    resourceType: { type: String },
    resourceId: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
