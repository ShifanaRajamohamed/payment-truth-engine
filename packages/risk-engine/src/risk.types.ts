export {
  RiskLevel,
  RiskSignalType,
  RiskSignal,
  RiskAssessment,
  Payment,
  Beneficiary,
  Organization
} from '@deepaudit/shared-types';

export interface EvaluationContext {
  payment: Partial<import('@deepaudit/shared-types').Payment>;
  beneficiary?: import('@deepaudit/shared-types').Beneficiary;
  organization?: import('@deepaudit/shared-types').Organization;
  historicalPayments?: import('@deepaudit/shared-types').Payment[];
  requestContext?: {
    deviceFingerprint?: string;
    ipAddress?: string;
    locationCity?: string;
    requestTimestamp?: string;
  };
}
