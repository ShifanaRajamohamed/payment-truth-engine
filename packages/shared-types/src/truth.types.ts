export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'DETECTED' | 'INVESTIGATING' | 'ROOT_CAUSE_FOUND' | 'VERIFIED' | 'REPAIRED' | 'ESCALATED' | 'CLOSED';

export type SystemStatus = 'SUCCESS' | 'CAPTURED' | 'FAILED' | 'PENDING' | 'UNPAID' | 'PAID' | 'REFUNDED' | 'DELAYED' | 'UNKNOWN' | 'REVERSED' | 'DEBITED' | 'CREDITED' | 'DECLINED' | 'AUTHORIZED' | 'SETTLED' | 'IN_TRANSIT';

export interface SystemTruthMatrix {
  bank: {
    status: SystemStatus;
    reference: string;
    amount: number;
    timestamp: string;
    description: string;
    rawPayload?: Record<string, any>;
  };
  gateway: {
    status: SystemStatus;
    paymentId: string;
    amount: number;
    timestamp: string;
    method: string;
    signatureValid: boolean;
    rawPayload?: Record<string, any>;
  };
  webhook: {
    status: SystemStatus;
    event: string;
    httpStatusCode: number;
    attempts: number;
    deliveryTime: string;
    lastError?: string;
    rawPayload?: Record<string, any>;
  };
  merchantBackend: {
    status: SystemStatus;
    processingState: string;
    lastReceivedAt?: string;
    errorMessage?: string;
  };
  merchantDb: {
    orderId: string;
    orderStatus: SystemStatus;
    amount: number;
    customerId: string;
    updatedAt: string;
  };
  finalTruth: {
    isPaymentSuccessful: boolean;
    verdict: string;
    desynchronizationPoint: 'WEBHOOK_DELIVERY' | 'MERCHANT_BACKEND' | 'DATABASE_UPDATE' | 'GATEWAY_DROP' | 'BANK_REVERSAL' | 'NONE';
    customerAdvice: string;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  relativeTime: string;
  source: 'CUSTOMER' | 'BANK' | 'GATEWAY' | 'WEBHOOK' | 'MERCHANT_BACKEND' | 'MERCHANT_DB' | 'AI_AGENT' | 'VERIFICATION_ENGINE' | 'SAFE_REPAIR';
  eventType: string;
  title: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'WARNING' | 'INFO';
  latencyMs?: number;
  isFailurePoint?: boolean;
  metadata?: Record<string, any>;
}

export interface SystemGraphNode {
  id: string;
  label: string;
  type: 'customer' | 'bank' | 'gateway' | 'webhook' | 'merchant_backend' | 'database';
  status: 'healthy' | 'delayed' | 'failed' | 'warning';
  subtext: string;
  latency?: string;
  isFailureOrigin?: boolean;
  metrics?: {
    responseTime?: string;
    statusCode?: string | number;
    state?: string;
  };
}

export interface VerificationCheck {
  id: string;
  name: string;
  category: 'IDENTITY' | 'AMOUNT' | 'STATE' | 'IDEMPOTENCY' | 'SECURITY' | 'COMPLIANCE';
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  details: string;
  checkedAt: string;
  critical: boolean;
}

export interface DeterministicVerificationResult {
  isVerified: boolean;
  canSafeRepair: boolean;
  verificationToken?: string;
  checks: VerificationCheck[];
  rejectionReason?: string;
  repairActionType: 'MARK_ORDER_PAID' | 'MARK_ORDER_FAILED' | 'INITIATE_REFUND_WORKFLOW' | 'ESCALATE_MANUAL_REVIEW' | 'SYNC_REFUND_STATUS' | 'WAIT_AND_MONITOR';
  requiresHumanApproval: boolean;
  targetStateUpdate?: {
    entity: 'ORDER' | 'PAYMENT' | 'REFUND';
    id: string;
    from: string;
    to: string;
  };
}

export interface AIRootCauseAnalysis {
  confidence: number;
  category: 'WEBHOOK_PROCESSING_FAILURE' | 'DUPLICATE_PAYMENT' | 'PHANTOM_CREDIT_DESYNC' | 'REFUND_RECORD_MISMATCH' | 'TRANSIENT_WEBHOOK_DELAY' | 'DATABASE_TRANSACTION_ROLLBACK' | 'NETWORK_TIMEOUT';
  summary: string;
  detailedExplanation: string;
  evidence: string[];
  customerRisk: string;
  recommendedAction: string;
  voiceScript: {
    tamil: string;
    english: string;
    tanglish: string;
    hindi: string;
  };
}

export interface PaymentIncident {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  customerName: string;
  customerPhone?: string;
  customerClaim: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  truthMatrix: SystemTruthMatrix;
  timeline: TimelineEvent[];
  graphNodes: SystemGraphNode[];
  aiAnalysis?: AIRootCauseAnalysis;
  verification?: DeterministicVerificationResult;
  isRepaired: boolean;
  repairedAt?: string;
  repairedBy?: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  incidentId: string;
  actor: 'SYSTEM_MONITOR' | 'AI_AGENT' | 'VERIFICATION_ENGINE' | 'HUMAN_OPERATOR' | 'SAFE_REPAIR_ENGINE';
  actorName: string;
  action: string;
  details: string;
  stateDelta?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  cryptographicSignature: string;
}

export type ScenarioType = 
  | 'SCENARIO_1_WEBHOOK_FAILURE'
  | 'SCENARIO_2_DUPLICATE_PAYMENT'
  | 'SCENARIO_3_PAYMENT_FAILED_ORDER_PAID'
  | 'SCENARIO_4_REFUND_MISMATCH'
  | 'SCENARIO_5_DELAYED_WEBHOOK';

export interface ScenarioDefinition {
  id: ScenarioType;
  title: string;
  badge: string;
  description: string;
  sampleComplaint: {
    tamil: string;
    tanglish: string;
    english: string;
    hindi: string;
  };
  expectedRootCause: string;
  safeAction: string;
}
