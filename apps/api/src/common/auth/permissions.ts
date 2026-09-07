import { AuthTokenPayload } from '../utils/auth-token';

export type Permission =
  | 'CAN_VIEW_PAYMENT_TRUTH'
  | 'CAN_APPROVE_PAYMENT'
  | 'CAN_REPAIR_PAYMENT';

const ROLE_PERMISSIONS: Record<AuthTokenPayload['role'], readonly Permission[]> = {
  MAKER: ['CAN_VIEW_PAYMENT_TRUTH'],
  CHECKER: ['CAN_VIEW_PAYMENT_TRUTH', 'CAN_APPROVE_PAYMENT'],
  ADMIN: ['CAN_VIEW_PAYMENT_TRUTH', 'CAN_APPROVE_PAYMENT', 'CAN_REPAIR_PAYMENT'],
  AUDITOR: ['CAN_VIEW_PAYMENT_TRUTH'],
};

export function hasPermission(user: AuthTokenPayload, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function roleFromDemoEmail(email: string): AuthTokenPayload['role'] {
  const localPart = email.split('@', 1)[0].toLowerCase();
  if (localPart.includes('admin')) return 'ADMIN';
  if (localPart.includes('checker') || localPart.includes('approver')) return 'CHECKER';
  if (localPart.includes('auditor')) return 'AUDITOR';
  return 'MAKER';
}
