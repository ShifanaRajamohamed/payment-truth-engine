export type StepUpAuthMethod = 'PASSKEY_WEBAUTHN' | 'SMS_OTP' | 'HARDWARE_TOKEN';

export type StepUpStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED';

export interface ApprovalStep {
  stepNumber: number;
  requiredRole: 'MAKER' | 'CHECKER' | 'ADMIN';
  assignedUserId?: string;
  approvedByUserId?: string;
  approvedByName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionTimestamp?: string;
  comments?: string;
}

export interface AuthorizationRecord {
  id: string;
  paymentId: string;
  requiresStepUp: boolean;
  stepUpMethod?: StepUpAuthMethod;
  stepUpStatus: StepUpStatus;
  stepUpVerifiedAt?: string;
  approvalChain: ApprovalStep[];
  isFullyAuthorized: boolean;
  finalDecision: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface ApprovePaymentDto {
  paymentId: string;
  comments?: string;
  stepUpCredential?: any;
}

export interface RejectPaymentDto {
  paymentId: string;
  reason: string;
}
