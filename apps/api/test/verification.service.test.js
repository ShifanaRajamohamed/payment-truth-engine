const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { DeterministicVerificationService } = require('../dist/modules/truth/verification.service.js');

function createBaseIncident(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: 'INC-TEST-001',
    orderId: 'ORD_1001',
    paymentId: 'PAY_2001',
    amount: 5000,
    currency: 'INR',
    customerName: 'Test Customer',
    customerPhone: '+91 99999 99999',
    customerClaim: 'Debited but pending',
    severity: 'HIGH',
    status: 'ROOT_CAUSE_FOUND',
    createdAt: now,
    updatedAt: now,
    isRepaired: false,
    aiAnalysis: {
      confidence: 95,
      category: 'WEBHOOK_PROCESSING_FAILURE',
      summary: 'Webhook delivery dropped',
      detailedExplanation: 'Gateway succeeded, webhook dropped',
      evidence: ['Bank debit confirmed', 'Gateway status CAPTURED'],
      customerRisk: 'LOW',
      recommendedAction: 'MARK_ORDER_PAID',
      voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
    },
    truthMatrix: {
      bank: {
        status: 'DEBITED',
        reference: 'HDFC-REF-12345',
        amount: 5000,
        timestamp: now,
        description: 'Account debited'
      },
      gateway: {
        status: 'CAPTURED',
        paymentId: 'PAY_2001',
        amount: 5000,
        timestamp: now,
        method: 'UPI',
        signatureValid: true
      },
      webhook: {
        status: 'FAILED',
        event: 'payment.captured',
        httpStatusCode: 500,
        attempts: 3,
        deliveryTime: now
      },
      merchantBackend: {
        status: 'FAILED',
        processingState: 'UNHANDLED_EXCEPTION'
      },
      merchantDb: {
        orderId: 'ORD_1001',
        orderStatus: 'UNPAID',
        amount: 5000,
        customerId: 'CUST_001',
        updatedAt: now
      },
      finalTruth: {
        isPaymentSuccessful: true,
        verdict: 'PAYMENT_SUCCESS_ORDER_UNPAID',
        desynchronizationPoint: 'WEBHOOK_DELIVERY',
        customerAdvice: 'Do not repay.'
      }
    },
    timeline: [],
    graphNodes: [
      { id: 'node-db', label: 'Database', type: 'database', status: 'warning', subtext: 'Order: UNPAID' },
      { id: 'node-wh', label: 'Webhook', type: 'webhook', status: 'failed', subtext: 'Dropped' }
    ],
    auditTrail: [],
    ...overrides
  };
}

describe('PRIORITY 1: DeterministicVerificationService', () => {
  const service = new DeterministicVerificationService();

  it('1. Gateway CAPTURED + Merchant UNPAID (complete object verification)', () => {
    const incident = createBaseIncident();
    const result = service.verifyIncident(incident);

    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(result.isVerified, true, 'isVerified must be true');
    assert.strictEqual(result.canSafeRepair, true, 'canSafeRepair must be true');
    assert.strictEqual(result.repairActionType, 'MARK_ORDER_PAID');
    assert.strictEqual(result.requiresHumanApproval, true, 'requiresHumanApproval must always be true');
    assert.ok(typeof result.verificationToken === 'string' && result.verificationToken.length > 0, 'verificationToken must be present');
    assert.strictEqual(result.rejectionReason, undefined);

    assert.ok(result.targetStateUpdate, 'targetStateUpdate must exist');
    assert.strictEqual(result.targetStateUpdate.entity, 'ORDER');
    assert.strictEqual(result.targetStateUpdate.id, 'ORD_1001');
    assert.strictEqual(result.targetStateUpdate.from, 'UNPAID');
    assert.strictEqual(result.targetStateUpdate.to, 'PAID');

    assert.ok(Array.isArray(result.checks), 'checks must be an array');
    assert.strictEqual(result.checks.length, 6, 'must contain exactly 6 checks');

    for (const check of result.checks) {
      assert.ok(check.id, 'check must have id');
      assert.ok(check.name, 'check must have name');
      assert.ok(check.category, 'check must have category');
      assert.ok(['PASSED', 'FAILED', 'SKIPPED'].includes(check.status), `invalid status ${check.status}`);
      assert.ok(typeof check.critical === 'boolean', 'check must declare critical flag');
      assert.ok(check.details, 'check must have details');
      assert.ok(check.checkedAt, 'check must have checkedAt timestamp');
    }

    const criticalChecks = result.checks.filter(c => c.critical);
    assert.strictEqual(criticalChecks.length, 5, 'must have 5 critical checks');
    for (const crit of criticalChecks) {
      assert.strictEqual(crit.status, 'PASSED', `Critical check ${crit.id} must be PASSED`);
    }
  });

  it('2. Gateway CAPTURED + Merchant PAID (already repaired/paid guard)', () => {
    const incident = createBaseIncident();
    incident.truthMatrix.merchantDb.orderStatus = 'PAID';

    const result = service.verifyIncident(incident);

    assert.strictEqual(result.canSafeRepair, false, 'canSafeRepair must be false when already PAID');
    assert.strictEqual(result.repairActionType, 'ESCALATE_MANUAL_REVIEW');
    assert.ok(result.rejectionReason && result.rejectionReason.includes('PAID'), 'rejectionReason must explain order is already paid');
    assert.strictEqual(result.verificationToken, undefined, 'no verification token when repair is not safe');
    assert.strictEqual(result.requiresHumanApproval, true);
  });

  it('3. Gateway FAILED + Merchant UNPAID (cannot safe repair failed payment)', () => {
    const incident = createBaseIncident();
    incident.truthMatrix.gateway.status = 'FAILED';

    const result = service.verifyIncident(incident);

    assert.strictEqual(result.isVerified, false, 'isVerified must be false for failed gateway');
    assert.strictEqual(result.canSafeRepair, false, 'canSafeRepair must be false');
    assert.strictEqual(result.repairActionType, 'ESCALATE_MANUAL_REVIEW');
    assert.strictEqual(result.verificationToken, undefined);

    const gwCheck = result.checks.find(c => c.id === 'chk-gw-status');
    assert.ok(gwCheck);
    assert.strictEqual(gwCheck.status, 'FAILED');
  });

  it('4. Gateway FAILED + Merchant PAID (critical discrepancy)', () => {
    const incident = createBaseIncident();
    incident.truthMatrix.gateway.status = 'FAILED';
    incident.truthMatrix.merchantDb.orderStatus = 'PAID';

    const result = service.verifyIncident(incident);

    assert.strictEqual(result.isVerified, false);
    assert.strictEqual(result.canSafeRepair, false);
    assert.strictEqual(result.repairActionType, 'ESCALATE_MANUAL_REVIEW');
  });

  it('5. Amount mismatch between gateway, bank, and merchant order', () => {
    const incident = createBaseIncident();
    incident.truthMatrix.gateway.amount = 4500; // mismatch vs 5000

    const result = service.verifyIncident(incident);

    assert.strictEqual(result.isVerified, false);
    assert.strictEqual(result.canSafeRepair, false);
    const amountCheck = result.checks.find(c => c.id === 'chk-amount-match');
    assert.ok(amountCheck);
    assert.strictEqual(amountCheck.status, 'FAILED');
    assert.ok(amountCheck.details.includes('discrepancy found'));
  });

  it('6. Currency mismatch / currency validation', () => {
    const incident = createBaseIncident();
    incident.currency = 'USD'; // Foreign currency mismatch

    const result = service.verifyIncident(incident);
    assert.strictEqual(result.isVerified, false, 'Currency mismatch must fail verification');
    assert.strictEqual(result.canSafeRepair, false, 'Currency mismatch cannot be safe to repair');
    const amountCheck = result.checks.find(c => c.id === 'chk-amount-match');
    assert.ok(amountCheck);
    assert.strictEqual(amountCheck.status, 'FAILED');
  });

  it('7. Payment ID mismatch (incident.paymentId vs gateway.paymentId)', () => {
    const incident = createBaseIncident();
    incident.paymentId = 'PAY_CORRECT_123';
    incident.truthMatrix.gateway.paymentId = 'PAY_MISMATCH_999';

    const result = service.verifyIncident(incident);
    assert.strictEqual(result.isVerified, false, 'Payment ID mismatch must fail verification');
    assert.strictEqual(result.canSafeRepair, false, 'Payment ID mismatch must not be repairable');
    const idCheck = result.checks.find(c => c.id === 'chk-gw-status');
    assert.ok(idCheck, 'Gateway/identity check must be present');
    assert.strictEqual(idCheck.status, 'FAILED', 'Payment ID mismatch check must be FAILED');
  });

  it('8. Missing or malformed gateway evidence', () => {
    const incident = createBaseIncident();
    delete incident.truthMatrix.gateway;

    const result = service.verifyIncident(incident);
    assert.strictEqual(result.isVerified, false, 'Missing gateway evidence must fail verification');
    assert.strictEqual(result.canSafeRepair, false, 'Missing gateway evidence cannot be repaired');
    const gwCheck = result.checks.find(c => c.id === 'chk-gw-status');
    assert.ok(gwCheck);
    assert.strictEqual(gwCheck.status, 'FAILED');
  });

  it('9. Missing merchant evidence (order identity match check)', () => {
    const incident = createBaseIncident();
    delete incident.truthMatrix.merchantDb;

    const result = service.verifyIncident(incident);
    assert.strictEqual(result.isVerified, false, 'Missing merchant evidence must fail verification');
    assert.strictEqual(result.canSafeRepair, false, 'Missing merchant evidence cannot be repaired');
    const orderCheck = result.checks.find(c => c.id === 'chk-order-identity');
    assert.ok(orderCheck);
    assert.strictEqual(orderCheck.status, 'FAILED');
  });

  it('10. Contradictory evidence (gateway CAPTURED but signatureValid === false)', () => {
    const incident = createBaseIncident();
    incident.truthMatrix.gateway.signatureValid = false; // forged/corrupt webhook

    const result = service.verifyIncident(incident);

    assert.strictEqual(result.isVerified, false, 'isVerified must be false on signature invalid');
    assert.strictEqual(result.canSafeRepair, false);
    const sigCheck = result.checks.find(c => c.id === 'chk-signature-valid');
    assert.ok(sigCheck);
    assert.strictEqual(sigCheck.status, 'FAILED');
  });

  it('11. PHANTOM_CREDIT_DESYNC hard-block behavior (MUST NEVER be repairable)', () => {
    const incident = createBaseIncident({
      aiAnalysis: {
        confidence: 99,
        category: 'PHANTOM_CREDIT_DESYNC',
        summary: 'Bank and Gateway never captured funds, but merchant marked PAID',
        detailedExplanation: 'Critical desynchronization: phantom order fulfilment without funds',
        evidence: ['No gateway record', 'No bank debit'],
        customerRisk: 'CRITICAL',
        recommendedAction: 'ESCALATE_MANUAL_REVIEW',
        voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
      }
    });
    incident.truthMatrix.gateway.status = 'FAILED';
    incident.truthMatrix.merchantDb.orderStatus = 'PAID';

    const result = service.verifyIncident(incident);

    assert.strictEqual(result.canSafeRepair, false, 'CRITICAL: canSafeRepair must NEVER be true for PHANTOM_CREDIT_DESYNC');
    assert.strictEqual(result.repairActionType, 'ESCALATE_MANUAL_REVIEW');
    assert.ok(result.rejectionReason && result.rejectionReason.includes('CRITICAL RISK'), 'rejectionReason must state CRITICAL RISK');
    assert.strictEqual(result.verificationToken, undefined);
    assert.strictEqual(result.requiresHumanApproval, true);
  });

  it('12. Unknown/unsupported gateway status state', () => {
    const incident = createBaseIncident();
    incident.truthMatrix.gateway.status = 'PENDING';

    const result = service.verifyIncident(incident);

    assert.strictEqual(result.isVerified, false);
    assert.strictEqual(result.canSafeRepair, false);
    const gwCheck = result.checks.find(c => c.id === 'chk-gw-status');
    assert.ok(gwCheck);
    assert.strictEqual(gwCheck.status, 'SKIPPED');
  });

  it('13. requiresHumanApproval behavior is universally enforced', () => {
    const scenarios = [
      'WEBHOOK_PROCESSING_FAILURE',
      'DUPLICATE_PAYMENT',
      'PHANTOM_CREDIT_DESYNC',
      'REFUND_RECORD_MISMATCH',
      'TRANSIENT_WEBHOOK_DELAY'
    ];

    for (const cat of scenarios) {
      const inc = createBaseIncident();
      inc.aiAnalysis.category = cat;
      const res = service.verifyIncident(inc);
      assert.strictEqual(res.requiresHumanApproval, true, `requiresHumanApproval must be true for category ${cat}`);
    }
  });

  it('14. Repair action classification for each known scenario category', () => {
    // A. DUPLICATE_PAYMENT
    const dupIncident = createBaseIncident({
      amount: 5000,
      aiAnalysis: {
        confidence: 96,
        category: 'DUPLICATE_PAYMENT',
        summary: 'Customer was double-debited',
        detailedExplanation: 'Two captures recorded',
        evidence: ['2x debit in bank'],
        customerRisk: 'MEDIUM',
        recommendedAction: 'INITIATE_REFUND_WORKFLOW',
        voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
      }
    });
    // In duplicate payment, bank & gateway amount = 2 * orderAmount
    dupIncident.truthMatrix.bank.amount = 10000;
    dupIncident.truthMatrix.gateway.amount = 10000;
    dupIncident.truthMatrix.merchantDb.amount = 5000;

    const dupResult = service.verifyIncident(dupIncident);
    assert.strictEqual(dupResult.isVerified, true);
    assert.strictEqual(dupResult.canSafeRepair, true);
    assert.strictEqual(dupResult.repairActionType, 'INITIATE_REFUND_WORKFLOW');
    assert.strictEqual(dupResult.targetStateUpdate?.entity, 'PAYMENT');
    assert.strictEqual(dupResult.targetStateUpdate?.to, 'REFUND_QUEUED');

    // B. REFUND_RECORD_MISMATCH
    const refIncident = createBaseIncident({
      aiAnalysis: {
        confidence: 92,
        category: 'REFUND_RECORD_MISMATCH',
        summary: 'Refund processed at gateway but merchant DB not synced',
        detailedExplanation: 'Gateway shows REFUNDED, merchant DB shows PAID',
        evidence: ['Gateway REFUNDED'],
        customerRisk: 'LOW',
        recommendedAction: 'SYNC_REFUND_STATUS',
        voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
      }
    });
    refIncident.truthMatrix.gateway.status = 'REFUNDED';
    refIncident.truthMatrix.merchantDb.orderStatus = 'PAID';

    const refResult = service.verifyIncident(refIncident);
    assert.strictEqual(refResult.canSafeRepair, true);
    assert.strictEqual(refResult.repairActionType, 'SYNC_REFUND_STATUS');
    assert.strictEqual(refResult.targetStateUpdate?.entity, 'ORDER');
    assert.strictEqual(refResult.targetStateUpdate?.to, 'REFUNDED');

    // C. TRANSIENT_WEBHOOK_DELAY
    const delayIncident = createBaseIncident({
      aiAnalysis: {
        confidence: 88,
        category: 'TRANSIENT_WEBHOOK_DELAY',
        summary: 'Webhook in flight',
        detailedExplanation: 'Under 60s latency, webhook retry pending',
        evidence: ['Gateway CAPTURED'],
        customerRisk: 'LOW',
        recommendedAction: 'WAIT_AND_MONITOR',
        voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
      }
    });

    const delayResult = service.verifyIncident(delayIncident);
    assert.strictEqual(delayResult.canSafeRepair, false);
    assert.strictEqual(delayResult.repairActionType, 'WAIT_AND_MONITOR');
    assert.ok(delayResult.rejectionReason && delayResult.rejectionReason.includes('in flight'));
  });

  it('15. Deterministic execution: identical inputs produce identical outputs (excluding timestamp/ephemeral token)', () => {
    const incidentA = createBaseIncident();
    const incidentB = JSON.parse(JSON.stringify(incidentA));

    const resA = service.verifyIncident(incidentA);
    const resB = service.verifyIncident(incidentB);

    assert.strictEqual(resA.isVerified, resB.isVerified);
    assert.strictEqual(resA.canSafeRepair, resB.canSafeRepair);
    assert.strictEqual(resA.repairActionType, resB.repairActionType);
    assert.strictEqual(resA.requiresHumanApproval, resB.requiresHumanApproval);
    assert.deepStrictEqual(resA.targetStateUpdate, resB.targetStateUpdate);
    assert.strictEqual(resA.checks.length, resB.checks.length);
    for (let i = 0; i < resA.checks.length; i++) {
      assert.strictEqual(resA.checks[i].id, resB.checks[i].id);
      assert.strictEqual(resA.checks[i].status, resB.checks[i].status);
      assert.strictEqual(resA.checks[i].critical, resB.checks[i].critical);
    }
  });
});
