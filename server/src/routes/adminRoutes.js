import express from 'express';
import bcrypt from 'bcryptjs';
import { stringify } from 'csv-stringify/sync';
import { AUDIT_ACTIONS, ROLES } from '@vms/shared/src/index.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requiredEmail, requiredString } from '../utils/validators.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { writeAuditLog } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';

const router = express.Router();
const systemSettings = {
  companyName: 'Visitor Management System',
  allowEmployeeSso: true,
  checkInWindowMinutes: 120
};

router.use(protect, authorize(ROLES.IT_ADMIN));

router.get('/settings', (_req, res) => {
  res.json({ settings: systemSettings });
});

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    if (typeof req.body.companyName === 'string') {
      systemSettings.companyName = requiredString(req.body.companyName, 'Company Name', 120);
    }
    if (typeof req.body.allowEmployeeSso === 'boolean') {
      systemSettings.allowEmployeeSso = req.body.allowEmployeeSso;
    }
    if (typeof req.body.checkInWindowMinutes === 'number' && req.body.checkInWindowMinutes > 0) {
      systemSettings.checkInWindowMinutes = req.body.checkInWindowMinutes;
    }

    await writeAuditLog({
      action: 'admin.settings-updated',
      user: req.user._id,
      role: req.user.role,
      resourceType: 'SystemSettings',
      resourceId: 'default',
      meta: systemSettings
    });

    res.json({ settings: systemSettings });
  })
);

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  })
);

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const name = requiredString(req.body.name, 'Name', 120);
    const email = requiredEmail(req.body.email);
    const password = requiredString(req.body.password, 'Password', 120);
    const role = requiredString(req.body.role, 'Role', 30);

    if (!Object.values(ROLES).includes(role)) throw new AppError('Invalid role', 400);

    const exists = await User.findOne({ email });
    if (exists) throw new AppError('User already exists', 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      manager: req.body.manager || null,
      ssoEnabled: Boolean(req.body.ssoEnabled)
    });

    await writeAuditLog({
      action: AUDIT_ACTIONS.USER_CREATED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      meta: { targetEmail: user.email }
    });

    res.status(201).json({ user });
  })
);

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    if (req.body.name) user.name = requiredString(req.body.name, 'Name', 120);
    if (req.body.email) user.email = requiredEmail(req.body.email);
    if (req.body.role) {
      const role = requiredString(req.body.role, 'Role', 30);
      if (!Object.values(ROLES).includes(role)) throw new AppError('Invalid role', 400);
      user.role = role;
    }
    if (req.body.password) user.passwordHash = await bcrypt.hash(requiredString(req.body.password, 'Password', 120), 12);
    if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
    if (typeof req.body.ssoEnabled === 'boolean') user.ssoEnabled = req.body.ssoEnabled;
    if (typeof req.body.manager !== 'undefined') user.manager = req.body.manager || null;

    await user.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.USER_UPDATED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      meta: { targetEmail: user.email }
    });

    res.json({ user });
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    await user.deleteOne();

    await writeAuditLog({
      action: AUDIT_ACTIONS.USER_DELETED,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'User',
      resourceId: req.params.id,
      meta: { targetEmail: user.email }
    });

    res.json({ message: 'User deleted' });
  })
);

router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const query = {};

    if (req.query.action) query.action = req.query.action;
    if (req.query.role) query.role = req.query.role;
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
    }

    const logs = await AuditLog.find(query).populate('user', 'name email role').sort({ createdAt: -1 }).limit(1000);
    res.json({ logs });
  })
);

router.get(
  '/logs/export.csv',
  asyncHandler(async (req, res) => {
    const logs = await AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(5000);

    const rows = logs.map((log) => ({
      timestamp: log.createdAt?.toISOString(),
      action: log.action,
      actorName: log.user?.name || '',
      actorEmail: log.user?.email || '',
      actorRole: log.role || '',
      resourceType: log.resourceType || '',
      resourceId: log.resourceId || '',
      meta: JSON.stringify(log.meta || {})
    }));

    const csv = stringify(rows, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  })
);

export default router;
