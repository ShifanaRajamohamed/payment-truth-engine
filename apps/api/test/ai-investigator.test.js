const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { AIInvestigatorService } = require('../dist/modules/truth/investigation/ai-investigator.service.js');
const { AIOutputValidator } = require('../dist/modules/truth/investigation/ai-output.validator.js');
const { InvestigationPromptBuilder } = require('../dist/modules/truth/investigation/investigation-prompt.builder.js');
const { deterministicVerificationService } = require('../dist/modules/truth/verification.service.js');
const { SafeStateRepairService } = require('../dist/modules/truth/repair.service.js');
const { mockDataStore } = require('../dist/modules/truth/mock-data.store.js');
const { hasPermission } = require('../dist/common/auth/permissions.js');

function createSampleIncident(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: `INC-AI-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId: 'ORD_AI_101',
    paymentId: 'PAY_AI_201',
    amount: 12499,
    currency: 'INR',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98765 43210',
    customerClaim: 'Money debited but order not confirmed',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    createdAt: now,
    updatedAt: now,
    isRepaired: false,
    truthMatrix: {
      bank: {
        status: 'DEBITED',
        utrReference: 'UTR_BANK_AI_999',
        amount: 12499,
        debitedAt: now,
        description: 'Debited via UPI'
      },
      gateway: {
        status: 'CAPTURED',
        paymentId: 'PAY_AI_201',
        amount: 12499,
        currency: 'INR',
        capturedAt: now,
        signatureValid: true
      },
      webhook: {
        status: 'FAILED',
        attempts: 3,
        httpStatusCode: 500,
        lastError: 'Internal Server Error'
      },
      merchantBackend: {
        status: 'DESYNCHRONIZED',
        processingState: 'IDLE'
      },
      merchantDb: {
        orderId: 'ORD_AI_101',
        orderStatus: 'UNPAID',
        amount: 12499,
        customerId: 'CUST_AI_777',
        updatedAt: now
      },
      finalTruth: {
        isPaymentSuccessful: true,
        verdict: 'PAYMENT_CAPTURED_WEBHOOK_DROPPED',
        desynchronizationPoint: 'WEBHOOK_DELIVERY',
        customerAdvice: 'Do not pay again'
      }
    },
    timeline: [],
    graphNodes: [],
    auditTrail: [],
    ...overrides
  };
}

describe('PHASE 3: Evidence-Grounded AI Investigator Safety & Validation Suite', () => {
  const repairService = new SafeStateRepairService();

  // Scenario A: Valid structured AI output parsed and validated
  it('A. Valid structured AI output parsed and validated', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);
    const validRuleIds = (verification.ruleResults || []).map(r => r.ruleId);

    const mockModelCaller = async () => JSON.stringify({
      observed_facts: [
        'Bank confirmed debit with valid UTR',
        'Gateway status is CAPTURED and signature is valid',
        'Merchant database order remains UNPAID'
      ],
      evidence: [validRuleIds[0], validRuleIds[1]],
      hypothesis: 'Webhook delivery dropped after capture',
      confidence: 0.96,
      verdict: 'Customer funds captured successfully. Order requires reconciliation to PAID.',
      recommended_action: 'MARK_ORDER_PAID',
      voiceScript: {
        english: 'Your payment was captured successfully.',
        tamil: 'உங்கள் கட்டணம் வெற்றிகரமாக பெறப்பட்டது.',
        tanglish: 'Unga payment capture aayirukku.',
        hindi: 'आपका भुगतान सफल रहा।'
      }
    });

    const investigator = new AIInvestigatorService(mockModelCaller);
    const report = await investigator.investigate(incident, verification);

    assert.equal(report.aiStatus, 'SUCCESS');
    assert.equal(report.confidence, 0.96);
    assert.equal(report.recommended_action, 'MARK_ORDER_PAID');
    assert.ok(report.evidence.length >= 2);
    assert.ok(report.observed_facts.length >= 3);
  });

  // Scenario B: Malformed AI JSON -> fallback with aiStatus = 'FALLBACK'
  it('B. Malformed AI JSON -> triggers fallback with aiStatus = "FALLBACK"', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);

    const mockMalformedCaller = async () => 'Not valid JSON: { observed_facts: incomplete';

    const investigator = new AIInvestigatorService(mockMalformedCaller);
    const report = await investigator.investigate(incident, verification);

    assert.equal(report.aiStatus, 'FALLBACK');
    assert.ok(report.validationErrors?.some(e => e.includes('Malformed JSON')));
    assert.ok(report.observed_facts.length > 0);
    assert.equal(report.recommended_action, verification.repairActionType);
  });

  // Scenario C: Missing fields caught by validator
  it('C. Missing fields caught by validator -> rejects invalid schema', () => {
    const validRuleIds = ['rule-01-payment-identity', 'rule-02-gateway-status'];

    // Missing verdict and recommended_action
    const invalidPayload = {
      observed_facts: ['Fact 1'],
      evidence: ['rule-01-payment-identity'],
      hypothesis: 'Hypothesis',
      confidence: 0.85
    };

    const result = AIOutputValidator.validate(invalidPayload, validRuleIds);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('verdict')));
    assert.ok(result.errors.some(e => e.includes('recommended_action')));
  });

  // Scenario D: Invalid confidence (<0, >1, NaN) rejected
  it('D. Invalid confidence values (<0, >1, NaN, string) rejected by validator', () => {
    const validRuleIds = ['rule-01-payment-identity'];
    const basePayload = {
      observed_facts: ['Fact 1'],
      evidence: ['rule-01-payment-identity'],
      hypothesis: 'Hypothesis',
      verdict: 'Verdict',
      recommended_action: 'MARK_ORDER_PAID'
    };

    // Test negative
    const resNegative = AIOutputValidator.validate({ ...basePayload, confidence: -0.2 }, validRuleIds);
    assert.equal(resNegative.isValid, false);
    assert.ok(resNegative.errors.some(e => e.includes('confidence')));

    // Test greater than 1
    const resOver = AIOutputValidator.validate({ ...basePayload, confidence: 1.5 }, validRuleIds);
    assert.equal(resOver.isValid, false);

    // Test NaN
    const resNaN = AIOutputValidator.validate({ ...basePayload, confidence: NaN }, validRuleIds);
    assert.equal(resNaN.isValid, false);

    // Test string
    const resStr = AIOutputValidator.validate({ ...basePayload, confidence: 'high' }, validRuleIds);
    assert.equal(resStr.isValid, false);
  });

  // Scenario E: Unknown/hallucinated evidence reference rejected
  it('E. Unknown or hallucinated evidence reference rejected by validator', () => {
    const validRuleIds = ['rule-01-payment-identity', 'rule-02-gateway-status'];

    const hallucinatedPayload = {
      observed_facts: ['Some fact'],
      evidence: ['rule-01-payment-identity', 'hallucinated-ai-evidence-rule-99'],
      hypothesis: 'Hypothesis',
      confidence: 0.9,
      verdict: 'Verdict',
      recommended_action: 'MARK_ORDER_PAID'
    };

    const result = AIOutputValidator.validate(hallucinatedPayload, validRuleIds);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('hallucinated-ai-evidence-rule-99')));
  });

  // Scenario F: AI unavailable -> aiStatus = 'UNAVAILABLE' with rule-grounded fallback
  it('F. AI unavailable (network/provider failure) -> returns rule-grounded fallback with aiStatus = "UNAVAILABLE"', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);

    const mockFailingCaller = async () => {
      throw new Error('503 Service Unavailable: Gemini API connection refused');
    };

    const investigator = new AIInvestigatorService(mockFailingCaller);
    const report = await investigator.investigate(incident, verification);

    assert.equal(report.aiStatus, 'UNAVAILABLE');
    assert.equal(report.recommended_action, verification.repairActionType);
    assert.ok(report.observed_facts.length > 0);
    assert.ok(report.evidence.length > 0);
  });

  // Scenario G: AI timeout -> triggers fallback
  it('G. AI timeout -> returns fallback gracefully', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);

    const mockTimeoutCaller = async () => {
      const err = new Error('AbortError: The operation was aborted due to timeout');
      err.name = 'AbortError';
      throw err;
    };

    const investigator = new AIInvestigatorService(mockTimeoutCaller, 50);
    const report = await investigator.investigate(incident, verification);

    assert.equal(report.aiStatus, 'UNAVAILABLE');
    assert.equal(report.recommended_action, verification.repairActionType);
  });

  // Scenario H: Hallucinated evidence ID rejection via PromptBuilder & Validator integration
  it('H. PromptBuilder passes valid rule IDs; validator rejects external rule IDs not in prompt', () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);
    const { validRuleIds } = InvestigationPromptBuilder.buildPrompt(incident, verification);

    assert.ok(validRuleIds.length > 0);
    assert.ok(validRuleIds.includes('rule-01-payment-identity'));

    const fakeReport = {
      observed_facts: ['Fact'],
      evidence: ['FAKE_RULE_NOT_IN_ENGINE'],
      hypothesis: 'Testing',
      confidence: 0.8,
      verdict: 'Verdict',
      recommended_action: 'MARK_ORDER_PAID'
    };

    const valResult = AIOutputValidator.validate(fakeReport, validRuleIds);
    assert.equal(valResult.isValid, false);
  });

  // Scenario I: AI recommending forbidden repair cannot authorize state change
  it('I. AI recommending forbidden repair cannot authorize state change (deterministic engine forbids repair)', async () => {
    const incident = createSampleIncident({
      truthMatrix: {
        ...createSampleIncident().truthMatrix,
        gateway: {
          status: 'FAILED',
          paymentId: 'PAY_FAILED_999',
          amount: 12499,
          currency: 'INR'
        }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);
    assert.equal(verification.canSafeRepair, false);

    // AI hallucinates that repair should be done anyway
    const rogueModelCaller = async () => JSON.stringify({
      observed_facts: ['Payment was attempted'],
      evidence: ['rule-02-gateway-status'],
      hypothesis: 'Payment captured despite gateway report',
      confidence: 0.99,
      verdict: 'Safe to mark order paid',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(rogueModelCaller);
    const report = await investigator.investigate(incident, verification);

    incident.aiInvestigation = report;
    incident.verification = verification;
    mockDataStore.saveIncident(incident);

    assert.throws(() => {
      repairService.repairState({
        incidentId: incident.id,
        operatorName: 'SecOps Lead',
        operatorRole: 'ADMIN'
      });
    }, /Cannot execute state repair|Deterministic verification failed/);
  });

  // Scenario J: AI attempting to override BLOCKED is rejected by safety gate
  it('J. AI attempting to override BLOCKED status is rejected by safety gate', async () => {
    const incident = createSampleIncident({
      truthMatrix: {
        ...createSampleIncident().truthMatrix,
        gateway: {
          status: 'CAPTURED',
          paymentId: 'PAY_DIFF',
          amount: 12499,
          currency: 'INR',
          signatureValid: false // Causes signature failure -> BLOCKED
        }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);
    assert.equal(verification.reconciliationStatus, 'BLOCKED');
    assert.equal(verification.canSafeRepair, false);

    const overriderModelCaller = async () => JSON.stringify({
      observed_facts: ['Signature failed but user looks trustworthy'],
      evidence: ['rule-02-gateway-status'],
      hypothesis: 'Overridden by AI judgment',
      confidence: 0.99,
      verdict: 'Override block and mark paid',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(overriderModelCaller);
    const report = await investigator.investigate(incident, verification);

    incident.aiInvestigation = report;
    incident.verification = verification;
    mockDataStore.saveIncident(incident);

    // Execution must be rejected
    assert.throws(() => {
      repairService.repairState({
        incidentId: incident.id,
        operatorName: 'SecOps',
        operatorRole: 'ADMIN'
      });
    }, /Cannot execute state repair|Deterministic verification failed/);
  });

  // Scenario K: AI attempting to override PHANTOM_CREDIT_DESYNC is hard-blocked
  it('K. AI attempting to override PHANTOM_CREDIT_DESYNC is hard-blocked', async () => {
    // SCENARIO 3 archetype: Gateway FAILED, Merchant PAID, bank = 0 debited
    const incident = mockDataStore.generateScenarioIncident('SCENARIO_3_PAYMENT_FAILED_ORDER_PAID');
    const verification = deterministicVerificationService.verifyIncident(incident);

    assert.equal(verification.reconciliationStatus, 'BLOCKED');
    assert.equal(verification.canSafeRepair, false);

    const rogueCaller = async () => JSON.stringify({
      observed_facts: ['Order is already paid in DB'],
      evidence: ['rule-02-gateway-status'],
      hypothesis: 'Keep order paid',
      confidence: 0.99,
      verdict: 'Confirmed paid',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(rogueCaller);
    const report = await investigator.investigate(incident, verification);

    incident.aiInvestigation = report;
    incident.verification = verification;
    mockDataStore.saveIncident(incident);

    assert.throws(() => {
      repairService.repairState({
        incidentId: incident.id,
        operatorName: 'SecOps',
        operatorRole: 'ADMIN'
      });
    }, /CRITICAL RISK: Money was NOT captured|Cannot execute state repair/);
  });

  // Scenario L: Deterministic engine working identically with AI completely disabled
  it('L. Deterministic engine operates identically with AI completely disabled', () => {
    const incidentA = createSampleIncident();
    const incidentB = createSampleIncident();

    // Verification runs purely without any AI invocation
    const verificationA = deterministicVerificationService.verifyIncident(incidentA);
    const verificationB = deterministicVerificationService.verifyIncident(incidentB);

    assert.equal(verificationA.isVerified, verificationB.isVerified);
    assert.equal(verificationA.canSafeRepair, verificationB.canSafeRepair);
    assert.equal(verificationA.repairActionType, verificationB.repairActionType);
    assert.equal(verificationA.reconciliationStatus, verificationB.reconciliationStatus);
    assert.equal(verificationA.ruleResults.length, verificationB.ruleResults.length);
  });

  // Scenario M: AI explanation correctly reflecting rule results
  it('M. AI explanation correctly reflects deterministic rule results', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);

    const investigator = new AIInvestigatorService(); // No custom caller -> deterministic fallback
    const report = await investigator.investigate(incident, verification);

    // Verifies that rule results are directly embedded in observed facts and evidence
    assert.ok(report.observed_facts.some(f => f.includes('rule-02-gateway-status')));
    assert.ok(report.evidence.includes('rule-02-gateway-status'));
    assert.equal(report.recommended_action, 'MARK_ORDER_PAID');
  });

  // Scenario N: AI cannot mutate payment state
  it('N. AI cannot mutate payment state (aiInvestigatorService has zero mutation capability)', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);

    const originalMerchantStatus = incident.truthMatrix.merchantDb.orderStatus;
    const originalRepaired = incident.isRepaired;

    const mockCaller = async () => JSON.stringify({
      observed_facts: ['Mutate state immediately'],
      evidence: ['rule-01-payment-identity'],
      hypothesis: 'State update required',
      confidence: 0.99,
      verdict: 'Update completed',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(mockCaller);
    await investigator.investigate(incident, verification);

    // State remains unchanged
    assert.equal(incident.truthMatrix.merchantDb.orderStatus, originalMerchantStatus);
    assert.equal(incident.isRepaired, originalRepaired);
  });

  // Scenario O: AI cannot bypass authorization checks
  it('O. AI cannot bypass authorization checks in SafeStateRepairService', () => {
    const unauthorizedUser = { id: 'viewer-1', name: 'Viewer User', role: 'VIEWER' };
    const canRepair = hasPermission(unauthorizedUser, 'CAN_REPAIR_PAYMENT');
    assert.strictEqual(canRepair, false, 'VIEWER role must NOT have CAN_REPAIR_PAYMENT permission');
  });

  // Scenario P: High AI confidence (0.99) cannot authorize repair on failed payment
  it('P. High AI confidence (0.99) cannot authorize repair on failed payment', async () => {
    const incident = createSampleIncident({
      truthMatrix: {
        ...createSampleIncident().truthMatrix,
        gateway: {
          status: 'FAILED',
          paymentId: 'PAY_FAILED_888',
          amount: 12499,
          currency: 'INR'
        }
      }
    });

    const verification = deterministicVerificationService.verifyIncident(incident);
    assert.equal(verification.isVerified, false);
    assert.equal(verification.canSafeRepair, false);

    const highConfidenceCaller = async () => JSON.stringify({
      observed_facts: ['User is VIP customer'],
      evidence: ['rule-02-gateway-status'],
      hypothesis: 'Always trust VIP customer',
      confidence: 0.99,
      verdict: 'VIP order should be marked paid',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(highConfidenceCaller);
    const report = await investigator.investigate(incident, verification);

    assert.equal(report.confidence, 0.99);

    incident.aiInvestigation = report;
    incident.verification = verification;
    mockDataStore.saveIncident(incident);

    // Attempting state repair must be blocked by deterministic verification
    assert.throws(() => {
      repairService.repairState({
        incidentId: incident.id,
        operatorName: 'SecOps Lead',
        operatorRole: 'ADMIN'
      });
    }, /Cannot execute state repair|Deterministic verification failed/);
  });

  // Scenario Q: Legitimate forensic explanations containing SQL/scripting keywords are accepted as plain text
  it('Q. Legitimate forensic explanations containing SQL-like or scripting terms are accepted as display text', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);
    const validRuleIds = (verification.ruleResults || []).map(r => r.ruleId);

    const forensicCaller = async () => JSON.stringify({
      observed_facts: [
        'Merchant log indicates: failed UPDATE orders SET status = "PAID" WHERE id = "ORD_AI_101"',
        'Webhook handler aborted before running DELETE FROM temp_events',
        'Frontend script reported: eval() is disabled by Content Security Policy'
      ],
      evidence: [validRuleIds[0]],
      hypothesis: 'Database lock prevented UPDATE orders query from completing',
      confidence: 0.94,
      verdict: 'Technical root cause identified in database lock contention.',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(forensicCaller);
    const report = await investigator.investigate(incident, verification);

    assert.strictEqual(report.aiStatus, 'SUCCESS');
    assert.strictEqual(report.confidence, 0.94);
    assert.ok(report.observed_facts.some(f => f.includes('UPDATE orders')));
    assert.ok(report.hypothesis.includes('UPDATE orders'));
  });

  // Scenario R: Malicious-looking text cannot cause execution because AI output has no execution path
  it('R. Malicious-looking injection payload in AI text remains inert display data with zero execution capability', async () => {
    const incident = createSampleIncident();
    const verification = deterministicVerificationService.verifyIncident(incident);
    const validRuleIds = (verification.ruleResults || []).map(r => r.ruleId);

    const maliciousCaller = async () => JSON.stringify({
      observed_facts: [
        'DROP TABLE incidents; --',
        '<script>alert("xss")</script>'
      ],
      evidence: [validRuleIds[0]],
      hypothesis: 'Attempted injection: update orders set is_repaired = true',
      confidence: 0.85,
      verdict: 'Inert display string',
      recommended_action: 'MARK_ORDER_PAID'
    });

    const investigator = new AIInvestigatorService(maliciousCaller);
    const report = await investigator.investigate(incident, verification);

    // Accepted structurally as plain text
    assert.strictEqual(report.aiStatus, 'SUCCESS');
    assert.ok(report.observed_facts[0].includes('DROP TABLE'));

    // Verify incident state remains completely unmutated by this AI report
    assert.strictEqual(incident.isRepaired, false);
    assert.strictEqual(incident.truthMatrix.merchantDb.orderStatus, 'UNPAID');
  });

  // Scenario S: Structural validation still strictly rejects invalid schemas and types
  it('S. Structural validation strictly rejects invalid schemas (e.g. non-string fact, invalid action enum)', () => {
    const validRuleIds = ['rule-01-payment-identity'];

    // Invalid action enum
    const invalidActionPayload = {
      observed_facts: ['Valid fact'],
      evidence: ['rule-01-payment-identity'],
      hypothesis: 'Test hypothesis',
      confidence: 0.9,
      verdict: 'Test verdict',
      recommended_action: 'INVALID_UNKNOWN_ACTION'
    };

    const resAction = AIOutputValidator.validate(invalidActionPayload, validRuleIds);
    assert.strictEqual(resAction.isValid, false);
    assert.ok(resAction.errors.some(e => e.includes('Invalid recommended_action')));

    // Non-string in observed_facts
    const invalidFactPayload = {
      observed_facts: [12345, null],
      evidence: ['rule-01-payment-identity'],
      hypothesis: 'Test hypothesis',
      confidence: 0.9,
      verdict: 'Test verdict',
      recommended_action: 'MARK_ORDER_PAID'
    };

    const resFact = AIOutputValidator.validate(invalidFactPayload, validRuleIds);
    assert.strictEqual(resFact.isValid, false);
    assert.ok(resFact.errors.some(e => e.includes('must be a non-empty string')));
  });

});

