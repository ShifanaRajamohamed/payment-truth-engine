export type AuditEventType =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_ANALYZED'
  | 'RISK_ASSESSED'
  | 'AI_EXPLANATION_REQUESTED'
  | 'AI_EXPLANATION_GENERATED'
  | 'STEP_UP_AUTH_REQUIRED'
  | 'AUTHORIZATION_COMPLETED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'BENEFICIARY_CREATED'
  | 'BENEFICIARY_MODIFIED'
  | 'POLICY_UPDATED';

export interface AuditEvent {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  eventType: AuditEventType;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetEntity: 'PAYMENT' | 'BENEFICIARY' | 'RISK_POLICY' | 'USER';
  targetId: string;
  orgId: string;
  summary: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  immutableHash: string;
  previousHash?: string;
}
