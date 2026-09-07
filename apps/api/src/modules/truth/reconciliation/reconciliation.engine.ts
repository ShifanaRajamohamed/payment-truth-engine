import { PaymentIncident, ReconciliationStatus } from '@deepaudit/shared-types';
import { ReconciliationRule, EngineReconciliationResult } from './reconciliation-rule.interface';
import {
  PaymentIdentityRule,
  GatewayStatusRule,
  MerchantDbStatusRule,
  BankEvidenceRule,
  AmountConsistencyRule,
  CurrencyConsistencyRule,
  WebhookConsistencyRule,
  DuplicateDetectionRule,
  EvidenceCompletenessRule,
  RiskBlockingRule
} from './reconciliation-rules';

export class ReconciliationEngine {
  private readonly rules: ReconciliationRule[];

  constructor(rules?: ReconciliationRule[]) {
    this.rules = rules || [
      new PaymentIdentityRule(),
      new GatewayStatusRule(),
      new MerchantDbStatusRule(),
      new BankEvidenceRule(),
      new AmountConsistencyRule(),
      new CurrencyConsistencyRule(),
      new WebhookConsistencyRule(),
      new DuplicateDetectionRule(),
      new EvidenceCompletenessRule(),
      new RiskBlockingRule()
    ];
  }

  public getRegisteredRules(): readonly ReconciliationRule[] {
    return this.rules;
  }

  public reconcile(incident: PaymentIncident): EngineReconciliationResult {
    const ruleResults = this.rules.map(rule => rule.evaluate(incident));

    const criticalResults = ruleResults.filter(r => r.critical);
    const criticalRulesPassed = criticalResults.every(r => r.status === 'PASS');
    const hasCriticalFail = criticalResults.some(r => r.status === 'FAIL');
    const hasInconclusive = ruleResults.some(r => r.status === 'INCONCLUSIVE');

    const matrix = incident.truthMatrix;
    const category = incident.aiAnalysis?.category;

    const isPhantomCredit = category === 'PHANTOM_CREDIT_DESYNC' ||
      (matrix?.gateway?.status === 'FAILED' && matrix?.merchantDb?.orderStatus === 'PAID');

    const gatewayCaptured = matrix?.gateway?.status === 'CAPTURED';
    const gatewayRefunded = matrix?.gateway?.status === 'REFUNDED';
    const merchantUnpaid = matrix?.merchantDb?.orderStatus === 'UNPAID';
    const merchantPaid = matrix?.merchantDb?.orderStatus === 'PAID';
    const merchantFailed = matrix?.merchantDb?.orderStatus === 'FAILED';

    const isDuplicatePayment = category === 'DUPLICATE_PAYMENT' ||
      (matrix?.bank?.amount !== undefined && matrix?.merchantDb?.amount !== undefined && matrix.bank.amount === matrix.merchantDb.amount * 2);

    const isRefundMismatch = category === 'REFUND_RECORD_MISMATCH' ||
      (gatewayRefunded && merchantPaid);

    const isTransientDelay = category === 'TRANSIENT_WEBHOOK_DELAY';
    const isContradictoryMerchantFailed = gatewayCaptured && merchantFailed;

    const signatureValid = matrix?.gateway?.signatureValid === true;

    let reconciliationStatus: ReconciliationStatus = 'MANUAL_REVIEW';
    let canSafeRepair = false;
    let rejectionReason: string | undefined;
    let recommendedAction: EngineReconciliationResult['recommendedAction'] = 'ESCALATE_MANUAL_REVIEW';

    if (isPhantomCredit) {
      reconciliationStatus = 'BLOCKED';
      canSafeRepair = false;
      recommendedAction = 'ESCALATE_MANUAL_REVIEW';
      rejectionReason = 'CRITICAL RISK: Money was NOT captured by Gateway or Bank. Automated repair blocked.';
    } else if (!signatureValid) {
      reconciliationStatus = 'BLOCKED';
      canSafeRepair = false;
      recommendedAction = 'ESCALATE_MANUAL_REVIEW';
      rejectionReason = 'Deterministic reconciliation failed: Gateway signature verification failed or missing.';
    } else if (isContradictoryMerchantFailed) {
      reconciliationStatus = 'MANUAL_REVIEW';
      canSafeRepair = false;
      recommendedAction = 'ESCALATE_MANUAL_REVIEW';
      rejectionReason = 'Contradictory evidence: Gateway captured funds but merchant order explicitly marked FAILED. Requires manual risk review.';
    } else if (isTransientDelay) {
      reconciliationStatus = 'MANUAL_REVIEW';
      canSafeRepair = false;
      recommendedAction = 'WAIT_AND_MONITOR';
      rejectionReason = 'Webhook is in flight. Awaiting automated gateway delivery before state modification.';
    } else if (hasCriticalFail) {
      reconciliationStatus = 'MANUAL_REVIEW';
      canSafeRepair = false;
      recommendedAction = 'ESCALATE_MANUAL_REVIEW';
      const failedRules = criticalResults.filter(r => r.status === 'FAIL').map(r => r.ruleName).join(', ');
      rejectionReason = `Deterministic reconciliation failed on critical rule(s): ${failedRules}.`;
    } else if (merchantPaid && gatewayCaptured) {
      // Both merchant DB and gateway confirm payment fulfilled
      reconciliationStatus = 'VERIFIED';
      canSafeRepair = false;
      recommendedAction = 'ESCALATE_MANUAL_REVIEW';
      rejectionReason = 'Order is already marked as PAID or gateway signature check failed.';
    } else if (isDuplicatePayment) {
      if (criticalRulesPassed) {
        reconciliationStatus = 'RECONCILIATION_REQUIRED';
        canSafeRepair = true;
        recommendedAction = 'INITIATE_REFUND_WORKFLOW';
      } else {
        reconciliationStatus = 'MANUAL_REVIEW';
        canSafeRepair = false;
        recommendedAction = 'ESCALATE_MANUAL_REVIEW';
      }
    } else if (isRefundMismatch) {
      if (gatewayRefunded || matrix?.bank?.status === 'CREDITED') {
        reconciliationStatus = 'RECONCILIATION_REQUIRED';
        canSafeRepair = true;
        recommendedAction = 'SYNC_REFUND_STATUS';
      } else {
        reconciliationStatus = 'MANUAL_REVIEW';
        canSafeRepair = false;
        recommendedAction = 'ESCALATE_MANUAL_REVIEW';
      }
    } else if (gatewayCaptured && merchantUnpaid) {
      if (criticalRulesPassed && !incident.isRepaired) {
        reconciliationStatus = 'RECONCILIATION_REQUIRED';
        canSafeRepair = true;
        recommendedAction = 'MARK_ORDER_PAID';
      } else {
        reconciliationStatus = 'MANUAL_REVIEW';
        canSafeRepair = false;
        recommendedAction = 'ESCALATE_MANUAL_REVIEW';
        rejectionReason = 'Order is already marked as PAID or gateway signature check failed.';
      }
    } else if (criticalRulesPassed && !hasInconclusive) {
      reconciliationStatus = 'VERIFIED';
    }

    return {
      reconciliationStatus,
      ruleResults,
      criticalRulesPassed,
      canSafeRepair,
      rejectionReason,
      recommendedAction
    };
  }
}

export const reconciliationEngine = new ReconciliationEngine();
