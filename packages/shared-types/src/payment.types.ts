import { Beneficiary } from './beneficiary.types';
import { RiskAssessment } from './risk.types';
import { AuthorizationRecord } from './authorization.types';

export type PaymentMethod = 'UPI' | 'Card' | 'Netbanking' | 'Wallet' | 'NEFT' | 'RTGS';

export type PaymentStatus = 
  | 'DRAFT'
  | 'PENDING_RISK_CHECK'
  | 'FLAGGED_HIGH_RISK'
  | 'PENDING_APPROVAL'
  | 'STEP_UP_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED';

export interface Payment {
  id: string;
  referenceNumber: string;
  creatorId: string;
  creatorName: string;
  orgId: string;
  beneficiaryId: string;
  beneficiary: Beneficiary;
  amount: number;
  currency: string;
  method: PaymentMethod;
  purpose: string;
  status: PaymentStatus;
  gateway: string;
  region: string;
  failureReason?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
  riskAssessment?: RiskAssessment;
  authorization?: AuthorizationRecord;
  hasInconsistency?: boolean;
  incidentId?: string;
  inconsistencyDetails?: {
    type: string;
    rootCause: string;
    bankStatus: string;
    bankRef?: string;
    gatewayStatus: string;
    gatewayRef?: string;
    webhookStatus: string;
    webhookError?: string;
    merchantStatus: string;
    merchantError?: string;
    finalVerdict: string;
    confidence: number;
    explanation?: string;
    evidence?: string[];
  };
}

export interface CreatePaymentDto {
  beneficiaryId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  purpose: string;
  region?: string;
  notes?: string;
}

export interface PaymentFilter {
  status?: PaymentStatus | 'ALL';
  method?: PaymentMethod | 'ALL';
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}
