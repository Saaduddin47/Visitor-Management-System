import express from 'express';
import { ROLES, AUDIT_ACTIONS } from '@vms/shared/src/index.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { requiredEmail, requiredString } from '../utils/validators.js';
import { clearAuthCookie, protect, setAuthCookie, signToken } from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditService.js';

const router = express.Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = requiredString(req.body.name, 'Name', 120);
    const email = requiredEmail(req.body.email);
    const password = requiredString(req.body.password, 'Password', 128);
    const role = req.body.role || ROLES.EMPLOYEE;

    const exists = await User.findOne({ email });
    if (exists) throw new AppError('User already exists', 409);

    const user = new User({ name, email, role, manager: req.body.manager || null });
    await user.setPassword(password);
    await user.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.USER_CREATED,
      user: user._id,
      role: user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      meta: { source: 'self-register' }
    });

    res.status(201).json({ message: 'Registered successfully' });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = requiredEmail(req.body.email);
    const password = requiredString(req.body.password, 'Password', 128);

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    user.lastLoginAt = new Date();
    await user.save();

    await writeAuditLog({
      action: AUDIT_ACTIONS.USER_LOGIN,
      user: user._id,
      role: user.role,
      resourceType: 'User',
      resourceId: user._id.toString()
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager
      }
    });
  })
);

router.post(
  '/sso/employee',
  asyncHandler(async (req, res) => {
    const email = requiredEmail(req.body.email);
    const user = await User.findOne({ email, role: ROLES.EMPLOYEE, ssoEnabled: true });

    if (!user) throw new AppError('SSO user not found or not enabled', 404);

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    await writeAuditLog({
      action: AUDIT_ACTIONS.USER_LOGIN,
      user: user._id,
      role: user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      meta: { source: 'sso-placeholder' }
    });

    res.json({
      message: 'SSO login simulated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager
      }
    });
  })
);

router.post(
  '/logout',
  protect,
  asyncHandler(async (req, res) => {
    clearAuthCookie(res);

    await writeAuditLog({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      user: req.user._id,
      role: req.user.role,
      resourceType: 'User',
      resourceId: req.user._id.toString()
    });

    res.json({ message: 'Logged out successfully' });
  })
);

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
