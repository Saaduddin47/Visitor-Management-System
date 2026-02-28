import { AuditLog } from '../models/AuditLog.js';

export const writeAuditLog = async ({
  action,
  user,
  role,
  resourceType,
  resourceId,
  meta
}) => {
  await AuditLog.create({
    action,
    user: user || undefined,
    role,
    resourceType,
    resourceId,
    meta
  });
};
