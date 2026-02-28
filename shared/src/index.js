export const ROLES = Object.freeze({
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  FRONT_DESK: 'front-desk',
  IT_ADMIN: 'it-admin'
});

export const REQUEST_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CHANGES: 'needs-changes',
  CHECKED_IN: 'checked-in',
  CHECKED_OUT: 'checked-out',
  NO_SHOW: 'no-show'
});

export const AUDIT_ACTIONS = Object.freeze({
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  REQUEST_CREATED: 'request.created',
  REQUEST_UPDATED: 'request.updated',
  REQUEST_APPROVED: 'request.approved',
  REQUEST_REJECTED: 'request.rejected',
  REQUEST_COMMENTED: 'request.commented',
  QR_SENT: 'request.qr-sent',
  VISITOR_CHECKIN: 'visitor.checkin',
  VISITOR_CHECKOUT: 'visitor.checkout',
  VISITOR_NO_SHOW: 'visitor.no-show',
  USER_CREATED: 'admin.user-created',
  USER_UPDATED: 'admin.user-updated',
  USER_DELETED: 'admin.user-deleted'
});
