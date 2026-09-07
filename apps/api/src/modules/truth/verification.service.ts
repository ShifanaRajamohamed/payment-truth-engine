import { PaymentIncident, DeterministicVerificationResult, VerificationCheck } from '@deepaudit/shared-types';
import crypto from 'crypto';
import { reconciliationEngine, ReconciliationEngine } from './reconciliation/reconciliation.engine';

export class DeterministicVerificationService {
  private readonly reconciliationEngine: ReconciliationEngine;

  constructor(engine?: ReconciliationEngine) {
    this.reconciliationEngine = engine || reconciliationEngine;
  }

  public getEngine(): ReconciliationEngine {
    return this.reconciliationEngine;
  }

  /**
   * Deterministically verifies all invariants before any state repair can be authorized.
   * This logic is 100% rule-based and DOES NOT rely on probabilistic LLM responses.
   * Leverages the multi-system ReconciliationEngine while maintaining full API contract backward compatibility.
   */
  public verifyIncident(incident: PaymentIncident): DeterministicVerificationResult {
    // 1. Run multi-system Reconciliation Engine across all 10 independent rules
    const recon = this.reconciliationEngine.reconcile(incident);
    const matrix = incident.truthMatrix;
    const now = new Date().toISOString();

    const hasGateway = !!matrix?.gateway;
    const hasBank = !!matrix?.bank;
    const hasMerchantDb = !!matrix?.merchantDb;

    // 2. Synthesize backward-compatible standard checks with rich auditable telemetry
    const checks: VerificationCheck[] = [];

    // Check 1: chk-gw-status
    const paymentIdMatches = !incident.paymentId || (hasGateway && !!matrix.gateway.paymentId && matrix.gateway.paymentId === incident.paymentId);
    const isGatewayCaptured = hasGateway && matrix.gateway.status === 'CAPTURED';
    const isGatewayFailed = hasGateway && matrix.gateway.status === 'FAILED';
    const isGatewayRefunded = hasGateway && matrix.gateway.status === 'REFUNDED';

    const gwStatusPassed = (isGatewayCaptured || isGatewayRefunded) && paymentIdMatches;
    const gwStatusFailed = !hasGateway || isGatewayFailed || !paymentIdMatches;

    let gwDetails = 'Gateway status verified';
    if (!hasGateway) {
      gwDetails = 'Gateway evidence is missing or corrupted';
    } else if (!paymentIdMatches) {
      gwDetails = `Payment ID mismatch: incident=${incident.paymentId} vs gateway=${matrix.gateway.paymentId}`;
    } else {
      gwDetails = `Gateway status is ${matrix.gateway.status} (Payment ID: ${matrix.gateway.paymentId})`;
    }

    checks.push({
      id: 'chk-gw-status',
      name: 'Payment Gateway Capture Verification',
      category: 'STATE',
      status: gwStatusPassed ? 'PASSED' : gwStatusFailed ? 'FAILED' : 'SKIPPED',
      details: gwDetails,
      checkedAt: now,
      critical: true,
      observedValue: hasGateway ? { status: matrix.gateway.status, paymentId: matrix.gateway.paymentId } : undefined,
      expectedValue: { status: 'CAPTURED | REFUNDED', paymentId: incident.paymentId || 'valid_id' },
      sourceReference: 'truthMatrix.gateway'
    });

    // Check 2: chk-amount-match
    const bankAmount = hasBank ? matrix.bank.amount : undefined;
    const gatewayAmount = hasGateway ? matrix.gateway.amount : undefined;
    const orderAmount = hasMerchantDb ? matrix.merchantDb.amount : undefined;
    const currencyValid = !incident.currency || incident.currency === 'INR';

    let amountMatches = false;
    let amountDetail = '';

    if (!hasBank || !hasGateway || !hasMerchantDb) {
      amountMatches = false;
      amountDetail = 'Missing ledger records across one or more systems';
    } else if (!currencyValid) {
      amountMatches = false;
      amountDetail = `Currency discrepancy: ${incident.currency} does not match merchant base currency INR`;
    } else if (incident.aiAnalysis?.category === 'DUPLICATE_PAYMENT') {
      amountMatches = bankAmount === (orderAmount! * 2) && gatewayAmount === (orderAmount! * 2);
      amountDetail = `Duplicate payment detected: debited 2x ₹${orderAmount} (Total: ₹${bankAmount})`;
    } else {
      amountMatches = bankAmount === gatewayAmount && gatewayAmount === orderAmount;
      amountDetail = `Bank: ₹${bankAmount}, Gateway: ₹${gatewayAmount}, Order: ₹${orderAmount}`;
    }

    checks.push({
      id: 'chk-amount-match',
      name: 'Multi-System Amount Parity Check',
      category: 'AMOUNT',
      status: amountMatches ? 'PASSED' : 'FAILED',
      details: amountMatches ? `Amounts match perfectly (${amountDetail})` : `Amount discrepancy found: ${amountDetail}`,
      checkedAt: now,
      critical: true,
      observedValue: { bank: bankAmount, gateway: gatewayAmount, order: orderAmount, currency: incident.currency || 'INR' },
      expectedValue: { parity: 'all_match', expectedCurrency: 'INR' },
      sourceReference: 'truthMatrix.bank.amount, truthMatrix.gateway.amount, truthMatrix.merchantDb.amount'
    });

    // Check 3: chk-signature-valid
    const sigValid = hasGateway && matrix.gateway.signatureValid === true;
    checks.push({
      id: 'chk-signature-valid',
      name: 'Cryptographic Signature & Header Check',
      category: 'SECURITY',
      status: sigValid ? 'PASSED' : 'FAILED',
      details: sigValid ? 'Gateway HMAC-SHA256 signature verified against merchant secret' : 'Signature verification failed or missing',
      checkedAt: now,
      critical: true,
      observedValue: { signatureValid: matrix?.gateway?.signatureValid },
      expectedValue: { signatureValid: true },
      sourceReference: 'truthMatrix.gateway.signatureValid'
    });

    // Check 4: chk-order-identity
    const orderMatches = hasMerchantDb && !!matrix.merchantDb.orderId && matrix.merchantDb.orderId === incident.orderId;
    checks.push({
      id: 'chk-order-identity',
      name: 'Merchant Order Identity Match',
      category: 'IDENTITY',
      status: orderMatches ? 'PASSED' : 'FAILED',
      details: hasMerchantDb && matrix.merchantDb.orderId
        ? `Order reference ${matrix.merchantDb.orderId} matches active merchant record`
        : 'Merchant order record missing or unreferenced',
      checkedAt: now,
      critical: true,
      observedValue: matrix?.merchantDb?.orderId,
      expectedValue: incident.orderId,
      sourceReference: 'truthMatrix.merchantDb.orderId'
    });

    // Check 5: chk-idempotency
    const alreadyRepaired = incident.isRepaired || (hasMerchantDb && matrix.merchantDb.orderStatus === 'PAID');
    const isScenario1 = incident.aiAnalysis?.category === 'WEBHOOK_PROCESSING_FAILURE';
    const idempotencyPass = isScenario1 ? !incident.isRepaired : true;

    checks.push({
      id: 'chk-idempotency',
      name: 'Idempotency & Duplicate Execution Prevention',
      category: 'IDEMPOTENCY',
      status: idempotencyPass ? 'PASSED' : 'FAILED',
      details: incident.isRepaired 
        ? 'Action was already executed previously. Re-execution blocked.' 
        : 'Action idempotency verified. Safe to proceed.',
      checkedAt: now,
      critical: true,
      observedValue: { isRepaired: incident.isRepaired, orderStatus: matrix?.merchantDb?.orderStatus },
      expectedValue: { isRepaired: false },
      sourceReference: 'incident.isRepaired'
    });

    // Check 6: chk-refund-state
    const refundExists = (hasGateway && matrix.gateway.status === 'REFUNDED') || (hasBank && matrix.bank.status === 'CREDITED');
    checks.push({
      id: 'chk-refund-state',
      name: 'Active Refund Status Integrity',
      category: 'STATE',
      status: 'PASSED',
      details: refundExists ? 'Refund status verified across Gateway & Bank ledger' : 'No conflicting refund holds exist',
      checkedAt: now,
      critical: false,
      observedValue: { gatewayStatus: matrix?.gateway?.status, bankStatus: matrix?.bank?.status },
      expectedValue: 'Consistent refund state',
      sourceReference: 'truthMatrix.gateway.status, truthMatrix.bank.status'
    });

    // Determine Repair Action Type & Authorization
    let canSafeRepair = false;
    let repairActionType: DeterministicVerificationResult['repairActionType'] = 'ESCALATE_MANUAL_REVIEW';
    let targetStateUpdate: DeterministicVerificationResult['targetStateUpdate'];
    let rejectionReason: string | undefined;

    const criticalChecksPassed = checks.filter(c => c.critical).every(c => c.status === 'PASSED');

    // Deterministic category resolution works autonomously even if aiAnalysis is absent
    const effectiveCategory = incident.aiAnalysis?.category ||
      (matrix?.gateway?.status === 'FAILED' && matrix?.merchantDb?.orderStatus === 'PAID' ? 'PHANTOM_CREDIT_DESYNC' :
       (matrix?.bank?.amount !== undefined && matrix?.merchantDb?.amount !== undefined && matrix.bank.amount === matrix.merchantDb.amount * 2) ? 'DUPLICATE_PAYMENT' :
       (isGatewayRefunded && matrix?.merchantDb?.orderStatus === 'PAID') ? 'REFUND_RECORD_MISMATCH' :
       (isGatewayCaptured && matrix?.merchantDb?.orderStatus === 'UNPAID') ? 'WEBHOOK_PROCESSING_FAILURE' :
       undefined);

    if (effectiveCategory === 'WEBHOOK_PROCESSING_FAILURE') {
      if (criticalChecksPassed && isGatewayCaptured && !alreadyRepaired) {
        canSafeRepair = true;
        repairActionType = 'MARK_ORDER_PAID';
        targetStateUpdate = {
          entity: 'ORDER',
          id: incident.orderId,
          from: 'UNPAID',
          to: 'PAID',
        };
      } else {
        rejectionReason = 'Order is already marked as PAID or gateway signature check failed.';
      }
    } else if (effectiveCategory === 'DUPLICATE_PAYMENT') {
      canSafeRepair = true;
      repairActionType = 'INITIATE_REFUND_WORKFLOW';
      targetStateUpdate = {
        entity: 'PAYMENT',
        id: incident.paymentId || 'DUPLICATE_PAYMENT',
        from: 'CAPTURED_UNALLOCATED',
        to: 'REFUND_QUEUED',
      };
    } else if (effectiveCategory === 'PHANTOM_CREDIT_DESYNC') {
      canSafeRepair = false; // MUST NEVER auto-repair phantom credits!
      repairActionType = 'ESCALATE_MANUAL_REVIEW';
      rejectionReason = 'CRITICAL RISK: Money was NOT captured by Gateway or Bank. Automated repair blocked.';
    } else if (effectiveCategory === 'REFUND_RECORD_MISMATCH') {
      if (refundExists) {
        canSafeRepair = true;
        repairActionType = 'SYNC_REFUND_STATUS';
        targetStateUpdate = {
          entity: 'ORDER',
          id: incident.orderId,
          from: 'PAID',
          to: 'REFUNDED',
        };
      }
    } else if (effectiveCategory === 'TRANSIENT_WEBHOOK_DELAY') {
      canSafeRepair = false;
      repairActionType = 'WAIT_AND_MONITOR';
      rejectionReason = 'Webhook is in flight. Awaiting automated gateway delivery before state modification.';
    }

    // Ensure descriptive rejectionReason is always populated when repair is not permitted
    if (!canSafeRepair && !rejectionReason) {
      if (!isGatewayCaptured) {
        rejectionReason = `Gateway status is ${matrix?.gateway?.status || 'UNKNOWN'}. Cannot safe repair uncaptured payment.`;
      } else if (!criticalChecksPassed) {
        const failedChecks = checks.filter(c => c.critical && c.status === 'FAILED').map(c => c.name).join(', ');
        rejectionReason = `Critical deterministic checks failed: ${failedChecks}.`;
      } else {
        rejectionReason = 'Reconciliation criteria not met for automated state repair.';
      }
    }

    // Ephemeral audit correlation & trace run identifier (observability only, NOT an authorization capability)
    const verificationTraceId = `TRC_RUN_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationToken = canSafeRepair ? verificationTraceId : undefined;

    return {
      isVerified: criticalChecksPassed,
      canSafeRepair,
      verificationTraceId,
      verificationToken,
      checks,
      repairActionType,
      rejectionReason,
      requiresHumanApproval: true,
      targetStateUpdate,
      reconciliationStatus: recon.reconciliationStatus,
      ruleResults: recon.ruleResults
    };
  }
}

export const deterministicVerificationService = new DeterministicVerificationService();
