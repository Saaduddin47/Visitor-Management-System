import express from 'express';
import { AUDIT_ACTIONS, REQUEST_STATUS, ROLES } from '@vms/shared/src/index.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requiredEmail, requiredString } from '../utils/validators.js';
import { upload } from '../utils/upload.js';
import { VisitorRequest } from '../models/VisitorRequest.js';
import { AppError } from '../utils/AppError.js';
import { createReferenceId, createVisitId } from '../utils/ids.js';
import { writeAuditLog } from '../services/auditService.js';
import { User } from '../models/User.js';
import { sendMail } from '../config/mailer.js';

const router = express.Router();

router.use(protect, authorize(ROLES.EMPLOYEE));

router.post(
  '/requests',
  upload.single('attachment'),
  asyncHandler(async (req, res) => {
    const visitorName = requiredString(req.body.visitorName, 'Visitor Name', 120);
    const visitorEmail = requiredEmail(req.body.visitorEmail, 'Visitor Email');
    const visitorPhone = requiredString(req.body.visitorPhone, 'Visitor Phone', 30);
    const dateOfVisit = requiredString(req.body.dateOfVisit, 'Date of Visit', 30);
    const timeOfVisit = requiredString(req.body.timeOfVisit, 'Time', 30);
    const purpose = requiredString(req.body.purpose, 'Purpose', 1000);
    const officeLocation = requiredString(req.body.officeLocation, 'Office Location', 120);

    const employee = await User.findById(req.user._id);
    if (!employee?.manager) {
      throw new AppError('Manager is not assigned to this employee', 400);
    }

    const request = await VisitorRequest.create({
      referenceId: createReferenceId(),
      visitId: createVisitId(),
      employee: req.user._id,
      manager: employee.manager,
      visitorName,
      visitorEmail,
      visitorPhone,
      dateOfVisit,
      timeOfVisit,
      purpose,
      officeLocation,
      attachmentPath: req.file ? req.file.path : undefined,
      status: REQUEST_STATUS.PENDING,
      actions: [{ action: REQUEST_STATUS.PENDING, user: req.user._id }]
    });

    await writeAuditLog({
      action: AUDIT_ACTIONS.REQUEST_CREATED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId }
    });

    const manager = await User.findById(employee.manager).select('name email');
    if (manager?.email) {
      await sendMail({
        to: manager.email,
        subject: `New Visitor Request Pending (${request.referenceId})`,
        html: `<div style="font-family: Inter, Arial, sans-serif; color: #0f172a;">
          <h3>New visitor request pending approval</h3>
          <p><strong>Employee:</strong> ${req.user.name}</p>
          <p><strong>Visitor:</strong> ${request.visitorName}</p>
          <p><strong>Date:</strong> ${request.dateOfVisit} ${request.timeOfVisit}</p>
          <p><strong>Reference:</strong> ${request.referenceId}</p>
        </div>`
      });
    }

    res.status(201).json({ request });
  })
);

router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const requests = await VisitorRequest.find({ employee: req.user._id })
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });

    res.json({ requests });
  })
);

router.patch(
  '/requests/:id',
  upload.single('attachment'),
  asyncHandler(async (req, res) => {
    const request = await VisitorRequest.findOne({ _id: req.params.id, employee: req.user._id });
    if (!request) throw new AppError('Request not found', 404);

    if (![REQUEST_STATUS.NEEDS_CHANGES, REQUEST_STATUS.REJECTED].includes(request.status)) {
      throw new AppError('Only editable requests can be updated', 400);
    }

    const updatableFields = [
      'visitorName',
      'visitorEmail',
      'visitorPhone',
      'dateOfVisit',
      'timeOfVisit',
      'purpose',
      'officeLocation'
    ];

    for (const field of updatableFields) {
      if (req.body[field]) {
        request[field] = requiredString(req.body[field], field, 1000);
      }
    }

    if (req.body.visitorEmail) {
      request.visitorEmail = requiredEmail(req.body.visitorEmail, 'Visitor Email');
    }

    if (req.file) request.attachmentPath = req.file.path;

    request.status = REQUEST_STATUS.PENDING;
    request.managerComment = '';
    request.actions.push({ action: 'resubmitted', user: req.user._id });
    await request.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.REQUEST_UPDATED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'VisitorRequest',
      resourceId: request._id.toString(),
      meta: { referenceId: request.referenceId }
    });

    const manager = await User.findById(request.manager).select('name email');
    if (manager?.email) {
      await sendMail({
        to: manager.email,
        subject: `Visitor Request Resubmitted (${request.referenceId})`,
        html: `<div style="font-family: Inter, Arial, sans-serif; color: #0f172a;">
          <h3>Visitor request resubmitted for your review</h3>
          <p><strong>Employee:</strong> ${req.user.name}</p>
          <p><strong>Visitor:</strong> ${request.visitorName}</p>
          <p><strong>Date:</strong> ${request.dateOfVisit} ${request.timeOfVisit}</p>
          <p><strong>Reference:</strong> ${request.referenceId}</p>
        </div>`
      });
    }

    res.json({ request });
  })
);

export default router;
