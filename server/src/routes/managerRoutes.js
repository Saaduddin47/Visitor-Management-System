import express from 'express';
import QRCode from 'qrcode';
import { AUDIT_ACTIONS, REQUEST_STATUS, ROLES } from '@vms/shared/src/index.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requiredString } from '../utils/validators.js';
import { VisitorRequest } from '../models/VisitorRequest.js';
import { writeAuditLog } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';
import { sendMail } from '../config/mailer.js';

const router = express.Router();

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
    const request = await VisitorRequest.findOne({ _id: req.params.id, manager: req.user._id });
    if (!request) throw new AppError('Request not found', 404);

    request.status = REQUEST_STATUS.APPROVED;
    request.managerComment = requiredString(req.body.comment || 'Approved', 'Comment', 2000);
    request.actions.push({ action: REQUEST_STATUS.APPROVED, user: req.user._id, remark: request.managerComment });

    request.qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify({
      visitId: request.visitId,
      referenceId: request.referenceId
    }));
    request.qrSentAt = new Date();

    await request.save();

    await sendMail({
      to: request.visitorEmail,
      subject: `Visit Approved (${request.referenceId})`,
      html: `<div style="font-family: Inter, Arial, sans-serif; color: #0f172a;">
        <h2>Your visit is approved</h2>
        <p><strong>Reference:</strong> ${request.referenceId}</p>
        <p><strong>Date:</strong> ${request.dateOfVisit} at ${request.timeOfVisit}</p>
        <p>Please show this QR code at front desk:</p>
        <img src="${request.qrCodeDataUrl}" alt="Visitor QR" style="width:220px;height:220px"/>
      </div>`
    });

    await writeAuditLog({
      action: AUDIT_ACTIONS.REQUEST_APPROVED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId }
    });

    await writeAuditLog({
      action: AUDIT_ACTIONS.QR_SENT,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { visitorEmail: request.visitorEmail }
    });

    res.json({ request });
  })
);

router.post(
  '/requests/:id/reject',
  asyncHandler(async (req, res) => {
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
