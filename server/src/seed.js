import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ROLES, REQUEST_STATUS, AUDIT_ACTIONS } from '@vms/shared/src/index.js';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { VisitorRequest } from './models/VisitorRequest.js';
import { AuditLog } from './models/AuditLog.js';

dotenv.config();

const seedUsers = [
  {
    name: 'IT Admin',
    email: 'admin@vms.local',
    password: 'Admin@123',
    role: ROLES.IT_ADMIN,
    ssoEnabled: false
  },
  {
    name: 'Manager One',
    email: 'manager@vms.local',
    password: 'Manager@123',
    role: ROLES.MANAGER,
    ssoEnabled: false
  },
  {
    name: 'Front Desk',
    email: 'frontdesk@vms.local',
    password: 'FrontDesk@123',
    role: ROLES.FRONT_DESK,
    ssoEnabled: false
  },
  {
    name: 'Employee One',
    email: 'employee@vms.local',
    password: 'Employee@123',
    role: ROLES.EMPLOYEE,
    ssoEnabled: true
  }
];

const makeDateString = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const ensureUser = async ({ name, email, password, role, ssoEnabled, manager }) => {
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ name, email, role, ssoEnabled, manager: manager || null, isActive: true });
    await user.setPassword(password);
    await user.save();
    return user;
  }

  user.name = name;
  user.role = role;
  user.ssoEnabled = Boolean(ssoEnabled);
  user.isActive = true;
  if (typeof manager !== 'undefined') user.manager = manager;
  await user.setPassword(password);
  await user.save();
  return user;
};

const ensureRequest = async ({ referenceId, visitId, employeeId, managerId, status, visitorName, visitorEmail, dateOfVisit, timeOfVisit, purpose }) => {
  const existing = await VisitorRequest.findOne({ referenceId });
  if (existing) return existing;

  return VisitorRequest.create({
    referenceId,
    visitId,
    employee: employeeId,
    manager: managerId,
    visitorName,
    visitorEmail,
    visitorPhone: '+1-555-000-1111',
    dateOfVisit,
    timeOfVisit,
    purpose,
    officeLocation: 'HQ - Block A',
    status,
    managerComment: status === REQUEST_STATUS.REJECTED ? 'Please provide agenda details' : '',
    actions: [
      { action: REQUEST_STATUS.PENDING, user: employeeId },
      ...(status === REQUEST_STATUS.PENDING
        ? []
        : [{ action: status, user: managerId, remark: status === REQUEST_STATUS.APPROVED ? 'Approved' : 'Rejected' }])
    ]
  });
};

const ensureAudit = async ({ action, user, role, resourceType, resourceId, meta }) => {
  const exists = await AuditLog.findOne({ action, resourceId });
  if (exists) return exists;

  return AuditLog.create({ action, user, role, resourceType, resourceId, meta });
};

const run = async () => {
  try {
    await connectDb();

    const manager = await ensureUser(seedUsers[1]);
    const admin = await ensureUser(seedUsers[0]);
    const frontDesk = await ensureUser(seedUsers[2]);
    const employee = await ensureUser({ ...seedUsers[3], manager: manager._id });

    const pending = await ensureRequest({
      referenceId: 'REF-SEED-001',
      visitId: 'VISIT-SEED-001',
      employeeId: employee._id,
      managerId: manager._id,
      status: REQUEST_STATUS.PENDING,
      visitorName: 'Ananya Rao',
      visitorEmail: 'ananya.rao@example.com',
      dateOfVisit: makeDateString(0),
      timeOfVisit: '10:30',
      purpose: 'Quarterly vendor review'
    });

    const approved = await ensureRequest({
      referenceId: 'REF-SEED-002',
      visitId: 'VISIT-SEED-002',
      employeeId: employee._id,
      managerId: manager._id,
      status: REQUEST_STATUS.APPROVED,
      visitorName: 'Rohan Sen',
      visitorEmail: 'rohan.sen@example.com',
      dateOfVisit: makeDateString(0),
      timeOfVisit: '14:00',
      purpose: 'Security audit meeting'
    });

    const rejected = await ensureRequest({
      referenceId: 'REF-SEED-003',
      visitId: 'VISIT-SEED-003',
      employeeId: employee._id,
      managerId: manager._id,
      status: REQUEST_STATUS.REJECTED,
      visitorName: 'Meera Shah',
      visitorEmail: 'meera.shah@example.com',
      dateOfVisit: makeDateString(1),
      timeOfVisit: '11:45',
      purpose: 'Partnership discussion'
    });

    await ensureAudit({
      action: AUDIT_ACTIONS.USER_CREATED,
      user: admin._id,
      role: admin.role,
      resourceType: 'User',
      resourceId: manager._id.toString(),
      meta: { seeded: true }
    });

    await ensureAudit({
      action: AUDIT_ACTIONS.REQUEST_CREATED,
      user: employee._id,
      role: employee.role,
      resourceType: 'VisitorRequest',
      resourceId: pending._id.toString(),
      meta: { seeded: true }
    });

    await ensureAudit({
      action: AUDIT_ACTIONS.REQUEST_APPROVED,
      user: manager._id,
      role: manager.role,
      resourceType: 'VisitorRequest',
      resourceId: approved._id.toString(),
      meta: { seeded: true }
    });

    await ensureAudit({
      action: AUDIT_ACTIONS.REQUEST_REJECTED,
      user: manager._id,
      role: manager.role,
      resourceType: 'VisitorRequest',
      resourceId: rejected._id.toString(),
      meta: { seeded: true }
    });

    console.log('Seed complete');
    console.log('Users:');
    console.log(' - admin@vms.local / Admin@123 (it-admin)');
    console.log(' - manager@vms.local / Manager@123 (manager)');
    console.log(' - frontdesk@vms.local / FrontDesk@123 (front-desk)');
    console.log(' - employee@vms.local / Employee@123 (employee, SSO enabled)');
  } catch (error) {
    console.error('Seed failed', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
