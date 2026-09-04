export type UserRole = 'MAKER' | 'CHECKER' | 'ADMIN' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  avatarInitial?: string;
  phone?: string;
  isPasskeyEnrolled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  currency: string;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  maxSingleTxAmount: number;
  dualControlThreshold: number;
  createdAt: string;
}
