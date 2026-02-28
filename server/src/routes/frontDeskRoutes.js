import express from 'express';
import { AUDIT_ACTIONS, REQUEST_STATUS, ROLES } from '@vms/shared/src/index.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { VisitorRequest } from '../models/VisitorRequest.js';
import { AppError } from '../utils/AppError.js';
import { requiredString } from '../utils/validators.js';
import { writeAuditLog } from '../services/auditService.js';

const router = express.Router();

router.use(protect, authorize(ROLES.FRONT_DESK));

router.get(
  '/today',
  asyncHandler(async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const visitors = await VisitorRequest.find({ dateOfVisit: today }).sort({ timeOfVisit: 1 });
    res.json({ visitors });
  })
);

router.post(
  '/scan',
  asyncHandler(async (req, res) => {
    const visitId = requiredString(req.body.visitId, 'Visit ID', 120);
    const request = await VisitorRequest.findOne({ visitId });
    if (!request) throw new AppError('Visit not found', 404);
    res.json({ request });
  })
);

router.post(
  '/manual',
  asyncHandler(async (req, res) => {
    const referenceId = requiredString(req.body.referenceId, 'Reference ID', 120);
    const request = await VisitorRequest.findOne({ referenceId });
    if (!request) throw new AppError('Visit not found', 404);
    res.json({ request });
  })
);

router.post(
  '/requests/:id/check-in',
  asyncHandler(async (req, res) => {
    const request = await VisitorRequest.findById(req.params.id);
    if (!request) throw new AppError('Visit not found', 404);

    request.status = REQUEST_STATUS.CHECKED_IN;
    request.checkedInAt = new Date();
    request.frontDeskRemarks = req.body.remark ? requiredString(req.body.remark, 'Remark', 500) : '';
    request.actions.push({ action: REQUEST_STATUS.CHECKED_IN, user: req.user._id, remark: request.frontDeskRemarks });
    await request.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.VISITOR_CHECKIN,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId, remark: request.frontDeskRemarks }
    });

    res.json({ request });
  })
);

router.post(
  '/requests/:id/check-out',
  asyncHandler(async (req, res) => {
    const request = await VisitorRequest.findById(req.params.id);
    if (!request) throw new AppError('Visit not found', 404);

    request.status = REQUEST_STATUS.CHECKED_OUT;
    request.checkedOutAt = new Date();
    request.frontDeskRemarks = req.body.remark ? requiredString(req.body.remark, 'Remark', 500) : '';
    request.actions.push({ action: REQUEST_STATUS.CHECKED_OUT, user: req.user._id, remark: request.frontDeskRemarks });
    await request.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.VISITOR_CHECKOUT,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId, remark: request.frontDeskRemarks }
    });

    res.json({ request });
  })
);

router.post(
  '/requests/:id/no-show',
  asyncHandler(async (req, res) => {
    const request = await VisitorRequest.findById(req.params.id);
    if (!request) throw new AppError('Visit not found', 404);

    request.status = REQUEST_STATUS.NO_SHOW;
    request.frontDeskRemarks = req.body.remark ? requiredString(req.body.remark, 'Remark', 500) : '';
    request.actions.push({ action: REQUEST_STATUS.NO_SHOW, user: req.user._id, remark: request.frontDeskRemarks });
    await request.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.VISITOR_NO_SHOW,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId, remark: request.frontDeskRemarks }
    });

    res.json({ request });
  })
);

export default router;
