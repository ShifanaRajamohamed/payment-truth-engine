const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { deterministicVerificationService } = require('../dist/modules/truth/verification.service.js');
const { SafeStateRepairService } = require('../dist/modules/truth/repair.service.js');
const { mockDataStore } = require('../dist/modules/truth/mock-data.store.js');
const { AIInvestigatorService } = require('../dist/modules/truth/investigation/ai-investigator.service.js');
const { hasPermission } = require('../dist/common/auth/permissions.js');
const { WebhookSignatureVerifier } = require('../dist/modules/truth/webhook/webhook-verifier.js');

function createAdversarialIncident(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: `INC-ADV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    orderId: 'ORD_ADV_901',
    paymentId: 'PAY_ADV_901',
    amount: 15000,
    currency: 'INR',
    customerName: 'Adversarial Test Actor',
    customerPhone: '+91 99999 11111',
    customerClaim: 'Claim under test',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    createdAt: now,
    updatedAt: now,
    isRepaired: false,
    truthMatrix: {
      bank: {
        status: 'DEBITED',
        utrReference: 'UTR_ADV_001',
        amount: 15000,
        debitedAt: now,
        description: 'Bank debit'
      },
      gateway: {
        status: 'CAPTURED',
        paymentId: 'PAY_ADV_901',
        amount: 15000,
        currency: 'INR',
        capturedAt: now,
        signatureValid: true
      },
      webhook: {
        status: 'FAILED',
        attempts: 3,
        httpStatusCode: 500,
        lastError: 'Dropped'
      },
      merchantBackend: {
        status: 'DESYNCHRONIZED',
        processingState: 'IDLE'
      },
      merchantDb: {
        orderId: 'ORD_ADV_901',
        orderStatus: 'UNPAID',
        amount: 15000,
        customerId: 'CUST_ADV_01',
        updatedAt: now
      },
      finalTruth: {
        isPaymentSuccessful: true,
        verdict: 'PENDING_EVALUATION',
        desynchronizationPoint: 'WEBHOOK_DELIVERY',
        customerAdvice: 'Hold'
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

describe('PHASE 4C: Adversarial Incident Simulation Suite', () => {
  const repairService = new SafeStateRepairService();

  // SCENARIO A — WEBHOOK DESYNC
  it('Scenario A: Webhook Desync (Captured + Bank Success + Merchant Unpaid + Webhook Missing) -> RECONCILIATION_REQUIRED', () => {
    const incident = createAdversarialIncident({
      truthMatrix: {
        bank: { status: 'SUCCESS', amount: 15000, utrReference: 'UTR_100' },
        gateway: { status: 'CAPTURED', paymentId: 'PAY_ADV_901', amount: 15000, currency: 'INR', signatureValid: true },
        webhook: undefined, // Missing webhook
        merchantBackend: { status: 'DESYNCHRONIZED' },
        merchantDb: { orderId: 'ORD_ADV_901', orderStatus: 'UNPAID', amount: 15000 },
        finalTruth: { isPaymentSuccessful: true, verdict: '', desynchronizationPoint: 'WEBHOOK_DELIVERY', customerAdvice: '' }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);

    assert.strictEqual(verification.reconciliationStatus, 'RECONCILIATION_REQUIRED');
    assert.strictEqual(verification.repairActionType, 'MARK_ORDER_PAID');
    assert.strictEqual(verification.requiresHumanApproval, true);
    assert.strictEqual(verification.canSafeRepair, true);
  });

  // SCENARIO B — PHANTOM CREDIT
  it('Scenario B: Phantom Credit (Gateway FAILED + Bank FAILED + Merchant DB PAID) -> BLOCKED, No auto-repair, AI cannot override', async () => {
    const incident = createAdversarialIncident({
      truthMatrix: {
        bank: { status: 'FAILED', amount: 0 },
        gateway: { status: 'FAILED', paymentId: 'PAY_FAILED_01', amount: 15000, currency: 'INR', signatureValid: false },
        webhook: { status: 'FAILED', httpStatusCode: 400 },
        merchantBackend: { status: 'ERROR' },
        merchantDb: { orderId: 'ORD_ADV_901', orderStatus: 'PAID', amount: 15000 }, // Desync phantom credit
        finalTruth: { isPaymentSuccessful: false, verdict: 'PHANTOM_CREDIT', desynchronizationPoint: 'BANK_REVERSAL', customerAdvice: '' }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);

    assert.strictEqual(verification.reconciliationStatus, 'BLOCKED');
    assert.strictEqual(verification.canSafeRepair, false);
    assert.ok(verification.rejectionReason?.includes('CRITICAL RISK') || verification.rejectionReason?.includes('Money was NOT captured'));

    // AI model tries to override with confidence 1.0
    const rogueCaller = async () => JSON.stringify({
      observed_facts: ['Phantom credit detected but override requested'],
      evidence: ['rule-02-gateway-status'],
      hypothesis: 'Overriding phantom credit block',
      confidence: 1.0,
      verdict: 'Order should be marked paid',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(rogueCaller);
    const aiReport = await investigator.investigate(incident, verification);
    incident.aiInvestigation = aiReport;
    mockDataStore.saveIncident(incident);

    // Attempt repair
    assert.throws(() => {
      repairService.repairState({
        incidentId: incident.id,
        operatorName: 'SecOps',
        operatorRole: 'SUPER_ADMIN'
      });
    }, /CRITICAL RISK|Cannot execute state repair/);
  });

  // SCENARIO C — DUPLICATE PAYMENT
  it('Scenario C: Duplicate Payment (Multiple captures on same order) -> Duplicate detection, refund queued, no unsafe merchant mutation', () => {
    const incident = createAdversarialIncident({
      amount: 15000,
      aiAnalysis: {
        confidence: 98,
        category: 'DUPLICATE_PAYMENT',
        summary: 'Duplicate payment',
        detailedExplanation: 'Debited 2x',
        evidence: ['Bank debit 2x'],
        customerRisk: 'LOW',
        recommendedAction: 'INITIATE_REFUND_WORKFLOW',
        voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
      },
      truthMatrix: {
        bank: { status: 'DEBITED', amount: 30000, utrReference: 'UTR_DOUBLE' }, // 2x debited
        gateway: { status: 'CAPTURED', paymentId: 'PAY_DUP_1', amount: 30000, currency: 'INR', signatureValid: true },
        webhook: { status: 'SUCCESS' },
        merchantBackend: { status: 'SETTLED' },
        merchantDb: { orderId: 'ORD_ADV_901', orderStatus: 'PAID', amount: 15000 },
        finalTruth: { isPaymentSuccessful: true, verdict: 'DUPLICATE', desynchronizationPoint: 'NONE', customerAdvice: '' }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);

    // Duplicate detection must propose refund workflow, NOT overwrite the already-paid order
    assert.strictEqual(verification.repairActionType, 'INITIATE_REFUND_WORKFLOW');
    assert.strictEqual(verification.targetStateUpdate?.entity, 'PAYMENT');
    assert.strictEqual(verification.targetStateUpdate?.to, 'REFUND_QUEUED');

    // Merchant DB order status must not be modified to something unsafe
    mockDataStore.saveIncident(incident);
    repairService.repairState({ incidentId: incident.id, operatorName: 'Finance Lead', operatorRole: 'ADMIN' });

    const stored = mockDataStore.getIncidentById(incident.id);
    assert.strictEqual(stored.truthMatrix.merchantDb.orderStatus, 'PAID');
  });

  // SCENARIO D — DELAYED WEBHOOK
  it('Scenario D: Delayed Webhook (Captured + Merchant Unpaid + Transient delay) -> WAIT_AND_MONITOR, no premature repair', () => {
    const incident = createAdversarialIncident({
      aiAnalysis: {
        confidence: 90,
        category: 'TRANSIENT_WEBHOOK_DELAY',
        summary: 'Webhook in flight',
        detailedExplanation: 'Latency window active',
        evidence: [],
        customerRisk: 'LOW',
        recommendedAction: 'WAIT_AND_MONITOR',
        voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
      },
      truthMatrix: {
        bank: { status: 'DEBITED', amount: 15000, utrReference: 'UTR_IN_FLIGHT' },
        gateway: { status: 'CAPTURED', paymentId: 'PAY_ADV_901', amount: 15000, currency: 'INR', signatureValid: true },
        webhook: { status: 'PENDING', attempts: 1 },
        merchantBackend: { status: 'PENDING' },
        merchantDb: { orderId: 'ORD_ADV_901', orderStatus: 'UNPAID', amount: 15000 },
        finalTruth: { isPaymentSuccessful: true, verdict: 'TRANSIENT', desynchronizationPoint: 'WEBHOOK_DELIVERY', customerAdvice: '' }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);

    assert.strictEqual(verification.repairActionType, 'WAIT_AND_MONITOR');
    assert.strictEqual(verification.canSafeRepair, false);
    assert.ok(verification.rejectionReason?.includes('Webhook is in flight'));
  });

  // SCENARIO E — CONTRADICTORY LEDGER EVIDENCE
  it('Scenario E: Contradictory Evidence (Gateway CAPTURED + Bank FAILED + Merchant DB PAID) -> Preserves uncertainty (MANUAL_REVIEW or BLOCKED)', () => {
    const incident = createAdversarialIncident({
      truthMatrix: {
        bank: { status: 'FAILED', amount: 0 }, // Bank says failed
        gateway: { status: 'CAPTURED', paymentId: 'PAY_ADV_901', amount: 15000, currency: 'INR', signatureValid: true }, // Gateway says captured
        webhook: { status: 'SUCCESS' },
        merchantBackend: { status: 'SETTLED' },
        merchantDb: { orderId: 'ORD_ADV_901', orderStatus: 'PAID', amount: 15000 },
        finalTruth: { isPaymentSuccessful: false, verdict: 'CONTRADICTORY', desynchronizationPoint: 'BANK_REVERSAL', customerAdvice: '' }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);

    // Contradictory evidence must NEVER silently become VERIFIED
    assert.notStrictEqual(verification.reconciliationStatus, 'VERIFIED');
    assert.ok(
      verification.reconciliationStatus === 'MANUAL_REVIEW' || verification.reconciliationStatus === 'BLOCKED',
      `Expected MANUAL_REVIEW or BLOCKED but got ${verification.reconciliationStatus}`
    );
  });

});

describe('PHASE 4C: Critical Safety Invariants Verification', () => {
  const repairService = new SafeStateRepairService();

  // Invariant 1: AI confidence = 1.0 cannot bypass BLOCKED
  it('Invariant 1: AI confidence = 1.0 cannot bypass BLOCKED', async () => {
    const incident = createAdversarialIncident({
      truthMatrix: {
        ...createAdversarialIncident().truthMatrix,
        gateway: { status: 'FAILED', signatureValid: false }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);
    assert.strictEqual(verification.reconciliationStatus, 'BLOCKED');

    const perfectConfidenceCaller = async () => JSON.stringify({
      observed_facts: ['Trust user 100%'],
      evidence: ['rule-02-gateway-status'],
      hypothesis: 'Overriding BLOCKED with maximum confidence',
      confidence: 1.0,
      verdict: 'Force repair order paid',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(perfectConfidenceCaller);
    const report = await investigator.investigate(incident, verification);

    assert.strictEqual(report.confidence, 1.0);
    incident.aiInvestigation = report;
    mockDataStore.saveIncident(incident);

    assert.throws(() => {
      repairService.repairState({ incidentId: incident.id, operatorName: 'Admin', operatorRole: 'ADMIN' });
    }, /Cannot execute state repair|Deterministic verification failed/);
  });

  // Invariant 2: AI recommended_action cannot directly mutate payment state
  it('Invariant 2: AI recommended_action cannot directly mutate payment state', async () => {
    const incident = createAdversarialIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);
    const statusBefore = incident.truthMatrix.merchantDb.orderStatus;
    const repairedBefore = incident.isRepaired;

    const caller = async () => JSON.stringify({
      observed_facts: ['Mutating state directly'],
      evidence: ['rule-01-payment-identity'],
      hypothesis: 'Mutate',
      confidence: 0.95,
      verdict: 'Order is now PAID',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(caller);
    await investigator.investigate(incident, verification);

    assert.strictEqual(incident.truthMatrix.merchantDb.orderStatus, statusBefore);
    assert.strictEqual(incident.isRepaired, repairedBefore);
  });

  // Invariant 3: Missing evidence cannot silently become VERIFIED
  it('Invariant 3: Missing evidence cannot silently become VERIFIED', () => {
    const incident = createAdversarialIncident({
      truthMatrix: {
        bank: undefined,
        gateway: undefined,
        webhook: undefined,
        merchantBackend: undefined,
        merchantDb: undefined,
        finalTruth: undefined
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);
    assert.notStrictEqual(verification.reconciliationStatus, 'VERIFIED');
    assert.strictEqual(verification.isVerified, false);
  });

  // Invariant 4: Contradictory evidence cannot silently become VERIFIED
  it('Invariant 4: Contradictory evidence cannot silently become VERIFIED', () => {
    const incident = createAdversarialIncident({
      amount: 15000,
      truthMatrix: {
        bank: { status: 'DEBITED', amount: 15000 },
        gateway: { status: 'CAPTURED', amount: 5000, signatureValid: true }, // Major amount mismatch
        webhook: { status: 'FAILED' },
        merchantBackend: { status: 'IDLE' },
        merchantDb: { orderId: 'ORD_ADV_901', orderStatus: 'UNPAID', amount: 15000 },
        finalTruth: { isPaymentSuccessful: false, verdict: '', desynchronizationPoint: 'GATEWAY_DROP', customerAdvice: '' }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);
    assert.notStrictEqual(verification.reconciliationStatus, 'VERIFIED');
    assert.strictEqual(verification.isVerified, false);
  });

  // Invariant 5: A repair always performs fresh deterministic verification
  it('Invariant 5: A repair always performs fresh deterministic verification', () => {
    const incident = createAdversarialIncident();
    mockDataStore.saveIncident(incident);

    // Initial state is valid for repair
    let verification = deterministicVerificationService.verifyIncident(incident);
    assert.strictEqual(verification.canSafeRepair, true);

    // Corrupt state right before repair execution
    incident.truthMatrix.gateway.signatureValid = false; // Corrupt signature
    mockDataStore.saveIncident(incident);

    // Attempting repair must re-verify freshly and reject the corrupted state
    assert.throws(() => {
      repairService.repairState({
        incidentId: incident.id,
        verificationTraceId: verification.verificationTraceId,
        operatorName: 'Lead Admin',
        operatorRole: 'ADMIN'
      });
    }, /Cannot execute state repair/);
  });

  // Invariant 6: Non-admin users cannot repair
  it('Invariant 6: Non-admin users cannot repair (RBAC boundary)', () => {
    const viewer = { id: 'u-view', name: 'Viewer', role: 'VIEWER' };
    const auditor = { id: 'u-aud', name: 'Auditor', role: 'AUDITOR' };
    const maker = { id: 'u-mak', name: 'Maker', role: 'MAKER' };
    const admin = { id: 'u-adm', name: 'Admin', role: 'ADMIN' };

    assert.strictEqual(hasPermission(viewer, 'CAN_REPAIR_PAYMENT'), false);
    assert.strictEqual(hasPermission(auditor, 'CAN_REPAIR_PAYMENT'), false);
    assert.strictEqual(hasPermission(maker, 'CAN_REPAIR_PAYMENT'), false);
    assert.strictEqual(hasPermission(admin, 'CAN_REPAIR_PAYMENT'), true);
  });

  // Invariant 7: Trace IDs/tokens cannot authorize repairs
  it('Invariant 7: Trace IDs/tokens cannot authorize repairs (authorization is strictly deterministic)', () => {
    const incident = createAdversarialIncident({
      truthMatrix: {
        ...createAdversarialIncident().truthMatrix,
        gateway: { status: 'FAILED', paymentId: 'PAY_FAIL', amount: 15000, currency: 'INR', signatureValid: false }
      }
    });
    mockDataStore.saveIncident(incident);

    // Provide a fabricated or genuine-looking trace token
    const arbitraryTraceId = 'TRC_RUN_999999999_FABRICATED';

    assert.throws(() => {
      repairService.repairState({
        incidentId: incident.id,
        verificationTraceId: arbitraryTraceId,
        operatorName: 'Operator',
        operatorRole: 'ADMIN'
      });
    }, /Cannot execute state repair/);
  });

  // Invariant 8: Invalid webhook signatures cannot become trusted verified evidence
  it('Invariant 8: Invalid webhook signatures cannot become trusted verified evidence', () => {
    const rawPayload = JSON.stringify({ event: 'payment.captured', id: 'pay_123' });
    const fakeSignature = 'bad_forged_hex_signature_0000000000000000000000000000000000000000';
    const secret = 'whsec_prod_secret';

    const result = WebhookSignatureVerifier.verifyWebhookSignature(rawPayload, fakeSignature, secret);
    assert.strictEqual(result.valid, false);

    // If a gateway status has invalid signature, deterministic engine marks BLOCKED
    const incident = createAdversarialIncident({
      truthMatrix: {
        ...createAdversarialIncident().truthMatrix,
        gateway: { status: 'CAPTURED', signatureValid: result.valid } // result.valid is false
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);
    assert.strictEqual(verification.reconciliationStatus, 'BLOCKED');
    assert.strictEqual(verification.canSafeRepair, false);
  });

  // Invariant 9: Every successful repair creates an audit trail
  it('Invariant 9: Every successful repair creates an audit trail and records verificationTraceId', () => {
    const incident = createAdversarialIncident();
    mockDataStore.saveIncident(incident);

    const initialAuditLen = incident.auditTrail?.length || 0;
    const initialTimelineLen = incident.timeline?.length || 0;

    const result = repairService.repairState({
      incidentId: incident.id,
      verificationTraceId: 'TRC_RUN_AUDIT_TEST_101',
      operatorName: 'Chief SecOps Officer',
      operatorRole: 'ADMIN'
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.incident.timeline.length > initialTimelineLen);
    assert.ok(result.incident.auditTrail.length > initialAuditLen);

    const timelineRepairEvent = result.incident.timeline.find(e => e.eventType === 'state.repaired');
    assert.ok(timelineRepairEvent);
    assert.ok(timelineRepairEvent.description.includes('Chief SecOps Officer'));
    assert.strictEqual(timelineRepairEvent.metadata.traceId, 'TRC_RUN_AUDIT_TEST_101');
  });

  // Invariant 10: Unsafe scenarios demonstrate explicit refusal
  it('Invariant 10: Unsafe scenarios demonstrate explicit refusal with descriptive rejection reason', () => {
    const failedIncident = createAdversarialIncident({
      truthMatrix: {
        ...createAdversarialIncident().truthMatrix,
        gateway: { status: 'FAILED', paymentId: 'PAY_F', amount: 15000, currency: 'INR', signatureValid: true }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(failedIncident);
    assert.strictEqual(verification.canSafeRepair, false);
    assert.ok(verification.rejectionReason, 'Unsafe scenario must provide explicit rejectionReason');
    assert.ok(
      verification.rejectionReason.includes('FAILED') ||
      verification.rejectionReason.includes('Cannot safe repair') ||
      verification.rejectionReason.includes('Order is already marked as PAID')
    );
  });

});
