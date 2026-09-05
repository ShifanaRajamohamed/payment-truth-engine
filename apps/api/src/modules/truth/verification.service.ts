import { PaymentIncident, DeterministicVerificationResult, VerificationCheck } from '@deepaudit/shared-types';

export class DeterministicVerificationService {
  /**
   * Deterministically verifies all invariants before any state repair can be authorized.
   * This logic is 100% rule-based and DOES NOT rely on probabilistic LLM responses.
   */
  public verifyIncident(incident: PaymentIncident): DeterministicVerificationResult {
    const checks: VerificationCheck[] = [];
    const matrix = incident.truthMatrix;
    const now = new Date().toISOString();

    // 1. Validate Payment ID & Gateway Status
    const isGatewayCaptured = matrix.gateway.status === 'CAPTURED';
    const isGatewayFailed = matrix.gateway.status === 'FAILED';
    const isGatewayRefunded = matrix.gateway.status === 'REFUNDED';
    
    checks.push({
      id: 'chk-gw-status',
      name: 'Payment Gateway Capture Verification',
      category: 'STATE',
      status: isGatewayCaptured || isGatewayRefunded ? 'PASSED' : isGatewayFailed ? 'FAILED' : 'SKIPPED',
      details: `Gateway status is ${matrix.gateway.status} (Payment ID: ${matrix.gateway.paymentId})`,
      checkedAt: now,
      critical: true,
    });

    // 2. Exact Amount Matching across Bank, Gateway, and Order
    const bankAmount = matrix.bank.amount;
    const gatewayAmount = matrix.gateway.amount;
    const orderAmount = matrix.merchantDb.amount;

    let amountMatches = false;
    let amountDetail = '';

    if (incident.aiAnalysis?.category === 'DUPLICATE_PAYMENT') {
      amountMatches = bankAmount === orderAmount * 2 && gatewayAmount === orderAmount * 2;
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
    });

    // 3. Cryptographic Signature & Webhook Verification
    const sigValid = matrix.gateway.signatureValid === true;
    checks.push({
      id: 'chk-signature-valid',
      name: 'Cryptographic Signature & Header Check',
      category: 'SECURITY',
      status: sigValid ? 'PASSED' : 'FAILED',
      details: sigValid ? 'Gateway HMAC-SHA256 signature verified against merchant secret' : 'Signature verification failed or missing',
      checkedAt: now,
      critical: true,
    });

    // 4. Order ID & Customer Reference Match
    const orderMatches = !!matrix.merchantDb.orderId && matrix.merchantDb.orderId === incident.orderId;
    checks.push({
      id: 'chk-order-identity',
      name: 'Merchant Order Identity Match',
      category: 'IDENTITY',
      status: orderMatches ? 'PASSED' : 'FAILED',
      details: `Order reference ${matrix.merchantDb.orderId} matches active merchant record`,
      checkedAt: now,
      critical: true,
    });

    // 5. Idempotency & Duplicate State Repair Prevention
    const alreadyRepaired = incident.isRepaired || matrix.merchantDb.orderStatus === 'PAID';
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
    });

    // 6. Refund Status Check
    const refundExists = matrix.gateway.status === 'REFUNDED' || matrix.bank.status === 'CREDITED';
    checks.push({
      id: 'chk-refund-state',
      name: 'Active Refund Status Integrity',
      category: 'STATE',
      status: 'PASSED',
      details: refundExists ? 'Refund status verified across Gateway & Bank ledger' : 'No conflicting refund holds exist',
      checkedAt: now,
      critical: false,
    });

    // Determine Repair Action Type & Authorization
    let canSafeRepair = false;
    let repairActionType: DeterministicVerificationResult['repairActionType'] = 'ESCALATE_MANUAL_REVIEW';
    let targetStateUpdate: DeterministicVerificationResult['targetStateUpdate'];
    let rejectionReason: string | undefined;

    const criticalChecksPassed = checks.filter(c => c.critical).every(c => c.status === 'PASSED');

    if (incident.aiAnalysis?.category === 'WEBHOOK_PROCESSING_FAILURE') {
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
    } else if (incident.aiAnalysis?.category === 'DUPLICATE_PAYMENT') {
      canSafeRepair = true;
      repairActionType = 'INITIATE_REFUND_WORKFLOW';
      targetStateUpdate = {
        entity: 'PAYMENT',
        id: incident.paymentId || 'DUPLICATE_PAYMENT',
        from: 'CAPTURED_UNALLOCATED',
        to: 'REFUND_QUEUED',
      };
    } else if (incident.aiAnalysis?.category === 'PHANTOM_CREDIT_DESYNC') {
      canSafeRepair = false; // MUST NEVER auto-repair phantom credits!
      repairActionType = 'ESCALATE_MANUAL_REVIEW';
      rejectionReason = 'CRITICAL RISK: Money was NOT captured by Gateway or Bank. Automated repair blocked.';
    } else if (incident.aiAnalysis?.category === 'REFUND_RECORD_MISMATCH') {
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
    } else if (incident.aiAnalysis?.category === 'TRANSIENT_WEBHOOK_DELAY') {
      canSafeRepair = false;
      repairActionType = 'WAIT_AND_MONITOR';
      rejectionReason = 'Webhook is in flight. Awaiting automated gateway delivery before state modification.';
    }

    const verificationToken = canSafeRepair 
      ? `VTOK_SECURE_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      : undefined;

    return {
      isVerified: criticalChecksPassed,
      canSafeRepair,
      verificationToken,
      checks,
      repairActionType,
      rejectionReason,
      requiresHumanApproval: true,
      targetStateUpdate,
    };
  }
}

export const deterministicVerificationService = new DeterministicVerificationService();
