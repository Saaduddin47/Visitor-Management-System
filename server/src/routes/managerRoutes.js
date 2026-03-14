import express from 'express';
import mongoose from 'mongoose';
import { AUDIT_ACTIONS, REQUEST_STATUS, ROLES } from '@vms/shared/src/index.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requiredString } from '../utils/validators.js';
import { VisitorRequest } from '../models/VisitorRequest.js';
import { writeAuditLog } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';
import { sendMail } from '../config/mailer.js';
import { ensureRequestQrCode } from '../utils/qr.js';

const router = express.Router();

const ensureValidRequestId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid request ID' });
    return false;
  }
  return true;
};

const buildQrInlineAttachment = (qrCodeDataUrl) => {
  const match = String(qrCodeDataUrl || '').match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (!match) return null;

  const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const base64Content = match[2];

  return {
    filename: `visitor-qr.${extension}`,
    content: base64Content,
    encoding: 'base64',
    cid: 'visitor-qr'
  };
};

router.use(protect, authorize(ROLES.MANAGER));

router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const requests = await VisitorRequest.find({ manager: req.user._id })
      .populate('employee', 'name email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  })
);

router.post(
  '/requests/:id/approve',
  asyncHandler(async (req, res) => {
    if (!ensureValidRequestId(req.params.id, res)) return;

    try {
      const request = await VisitorRequest.findOne({ _id: req.params.id, manager: req.user._id });
      console.log('[manager/approve] request lookup', { id: req.params.id, found: Boolean(request) });
      if (!request) throw new AppError('Request not found', 404);

      request.status = REQUEST_STATUS.APPROVED;
      request.managerComment = requiredString(req.body.comment || 'Approved', 'Comment', 2000);
      request.actions.push({ action: REQUEST_STATUS.APPROVED, user: req.user._id, remark: request.managerComment });

      await ensureRequestQrCode(request);
      request.qrSentAt = new Date();

      await request.save();

      try {
        const qrInlineAttachment = buildQrInlineAttachment(request.qrCodeDataUrl);
        const qrImageSrc = qrInlineAttachment ? 'cid:visitor-qr' : request.qrCodeDataUrl;

        await sendMail({
          to: request.visitorEmail,
          subject: `Visit Approved (${request.referenceId})`,
          html: `<div style="font-family: Inter, Arial, sans-serif; color: #0f172a;">
            <h2>Your visit is approved</h2>
            <p><strong>Reference:</strong> ${request.referenceId}</p>
            <p><strong>Date:</strong> ${request.dateOfVisit} at ${request.timeOfVisit}</p>
            <p>Please show this QR code at front desk:</p>
            <img src="${qrImageSrc}" alt="Visitor QR" style="width:220px;height:220px"/>
          </div>`,
          attachments: qrInlineAttachment ? [qrInlineAttachment] : undefined
        });

        await writeAuditLog({
          action: AUDIT_ACTIONS.QR_SENT,
          user: req.user._id,
          role: req.user.role,
          resourceType: 'VisitorRequest',
          resourceId: request._id.toString(),
          meta: { visitorEmail: request.visitorEmail }
        });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr.message);
      }

      await writeAuditLog({
        action: AUDIT_ACTIONS.REQUEST_APPROVED,
        user: req.user._id,
        role: req.user.role,
        resourceType: 'VisitorRequest',
        resourceId: request._id.toString(),
        meta: { referenceId: request.referenceId }
      });

      res.json({ request });
    } catch (err) {
      console.error(err);
      throw err;
    }
  })
);

router.post(
  '/requests/:id/reject',
  asyncHandler(async (req, res) => {
    if (!ensureValidRequestId(req.params.id, res)) return;

    const request = await VisitorRequest.findOne({ _id: req.params.id, manager: req.user._id });
    if (!request) throw new AppError('Request not found', 404);

    const comment = requiredString(req.body.comment || 'Rejected', 'Comment', 2000);
    request.status = REQUEST_STATUS.REJECTED;
    request.managerComment = comment;
    request.actions.push({ action: REQUEST_STATUS.REJECTED, user: req.user._id, remark: comment });
    await request.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.REQUEST_REJECTED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId, comment }
    });

    res.json({ request });
  })
);

router.post(
  '/requests/:id/comment',
  asyncHandler(async (req, res) => {
    if (!ensureValidRequestId(req.params.id, res)) return;

    const request = await VisitorRequest.findOne({ _id: req.params.id, manager: req.user._id });
    if (!request) throw new AppError('Request not found', 404);

    const comment = requiredString(req.body.comment, 'Comment', 2000);
    request.status = REQUEST_STATUS.NEEDS_CHANGES;
    request.managerComment = comment;
    request.actions.push({ action: REQUEST_STATUS.NEEDS_CHANGES, user: req.user._id, remark: comment });
    await request.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.REQUEST_COMMENTED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId, comment }
    });

    res.json({ request });
  })
);

export default router;
