import { PaymentIncident, AuditableRuleResult, ReconciliationStatus } from '@deepaudit/shared-types';

export interface ReconciliationRule {
  readonly id: string;
  readonly name: string;
  readonly category: AuditableRuleResult['category'];
  readonly critical: boolean;
  evaluate(incident: PaymentIncident): AuditableRuleResult;
}

export interface EngineReconciliationResult {
  reconciliationStatus: ReconciliationStatus;
  ruleResults: AuditableRuleResult[];
  criticalRulesPassed: boolean;
  canSafeRepair: boolean;
  rejectionReason?: string;
  recommendedAction: 'MARK_ORDER_PAID' | 'MARK_ORDER_FAILED' | 'INITIATE_REFUND_WORKFLOW' | 'ESCALATE_MANUAL_REVIEW' | 'SYNC_REFUND_STATUS' | 'WAIT_AND_MONITOR';
}
