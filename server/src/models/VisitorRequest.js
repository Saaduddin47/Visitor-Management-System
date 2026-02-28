import mongoose from 'mongoose';
import { REQUEST_STATUS } from '@vms/shared/src/index.js';

const visitActionSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remark: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const visitorRequestSchema = new mongoose.Schema(
  {
    referenceId: { type: String, unique: true, index: true },
    visitId: { type: String, unique: true, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visitorName: { type: String, required: true, trim: true },
    visitorEmail: { type: String, required: true, trim: true, lowercase: true },
    visitorPhone: { type: String, required: true, trim: true },
    dateOfVisit: { type: String, required: true },
    timeOfVisit: { type: String, required: true },
    purpose: { type: String, required: true, trim: true },
    officeLocation: { type: String, required: true, trim: true },
    attachmentPath: { type: String },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING
    },
    managerComment: { type: String, trim: true },
    qrCodeDataUrl: { type: String },
    qrSentAt: { type: Date },
    checkedInAt: { type: Date },
    checkedOutAt: { type: Date },
    frontDeskRemarks: { type: String },
    actions: [visitActionSchema]
  },
  { timestamps: true }
);

visitorRequestSchema.index({ dateOfVisit: 1, status: 1 });

export const VisitorRequest = mongoose.model('VisitorRequest', visitorRequestSchema);
