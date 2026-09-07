const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  ReconciliationEngine,
  reconciliationEngine
} = require('../dist/modules/truth/reconciliation/reconciliation.engine.js');
const {
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
} = require('../dist/modules/truth/reconciliation/reconciliation-rules.js');
const { DeterministicVerificationService } = require('../dist/modules/truth/verification.service.js');

function createBaseIncident(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: 'INC-RECON-001',
    orderId: 'ORD_RECON_101',
    paymentId: 'PAY_RECON_201',
    amount: 8500,
    currency: 'INR',
    customerName: 'Karthik Narayanan',
    customerPhone: '+91 98410 55443',
    customerClaim: 'Money deducted from bank but order still shows payment pending',
    severity: 'HIGH',
    status: 'ROOT_CAUSE_FOUND',
    createdAt: now,
    updatedAt: now,
    isRepaired: false,
    aiAnalysis: {
      confidence: 96,
      category: 'WEBHOOK_PROCESSING_FAILURE',
      summary: 'Webhook delivery dropped after capture',
      detailedExplanation: 'Gateway succeeded, webhook dropped',
      evidence: ['Bank debit confirmed', 'Gateway status CAPTURED'],
      customerRisk: 'LOW',
      recommendedAction: 'MARK_ORDER_PAID',
      voiceScript: { tamil: '', english: '', tanglish: '', hindi: '' }
    },
    truthMatrix: {
      bank: {
        status: 'DEBITED',
        reference: 'HDFC-UTR-882190',
        amount: 8500,
        timestamp: now,
        description: 'Account debited'
      },
      gateway: {
        status: 'CAPTURED',
        paymentId: 'PAY_RECON_201',
        amount: 8500,
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
        orderId: 'ORD_RECON_101',
        orderStatus: 'UNPAID',
        amount: 8500,
        customerId: 'CUST_4421',
        updatedAt: now
      },
      finalTruth: {
        isPaymentSuccessful: true,
        verdict: 'PAYMENT_SUCCESS_ORDER_UNPAID',
        desynchronizationPoint: 'WEBHOOK_DELIVERY',
        customerAdvice: 'Reconcile merchant order status.'
      }
    },
    timeline: [],
    graphNodes: [],
    auditTrail: [],
    ...overrides
  };
}

describe('PHASE 2: Deterministic Reconciliation Engine', () => {

  describe('Section 1: Individual Reconciliation Rules (Isolated Unit Tests)', () => {
    it('Rule 1 (PaymentIdentityRule): passes on matching payment and order IDs', () => {
      const rule = new PaymentIdentityRule();
      const inc = createBaseIncident();
      const res = rule.evaluate(inc);

      assert.strictEqual(res.ruleId, 'rule-01-payment-identity');
      assert.strictEqual(res.status, 'PASS');
      assert.strictEqual(res.critical, true);
      assert.ok(res.sourceReference);
    });

    it('Rule 1 (PaymentIdentityRule): fails on payment ID mismatch', () => {
      const rule = new PaymentIdentityRule();
      const inc = createBaseIncident();
      inc.truthMatrix.gateway.paymentId = 'PAY_DIFFERENT_999';

      const res = rule.evaluate(inc);
      assert.strictEqual(res.status, 'FAIL');
      assert.ok(res.explanation.includes('Payment ID mismatch'));
      assert.strictEqual(res.observedValue.paymentId, 'PAY_DIFFERENT_999');
    });

    it('Rule 1 (PaymentIdentityRule): fails on order ID mismatch', () => {
      const rule = new PaymentIdentityRule();
      const inc = createBaseIncident();
      inc.truthMatrix.merchantDb.orderId = 'ORD_DIFFERENT_999';

      const res = rule.evaluate(inc);
      assert.strictEqual(res.status, 'FAIL');
      assert.ok(res.explanation.includes('Order reference mismatch'));
    });

    it('Rule 2 (GatewayStatusRule): passes on CAPTURED or REFUNDED', () => {
      const rule = new GatewayStatusRule();
      const inc = createBaseIncident();

      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      inc.truthMatrix.gateway.status = 'REFUNDED';
      assert.strictEqual(rule.evaluate(inc).status, 'PASS');
    });

    it('Rule 2 (GatewayStatusRule): fails on confirmed FAILED status', () => {
      const rule = new GatewayStatusRule();
      const inc = createBaseIncident();
      inc.truthMatrix.gateway.status = 'FAILED';

      const res = rule.evaluate(inc);
      assert.strictEqual(res.status, 'FAIL');
      assert.ok(res.explanation.includes('Confirmed gateway failure'));
    });

    it('Rule 2 (GatewayStatusRule): returns INCONCLUSIVE on unresolved/pending state', () => {
      const rule = new GatewayStatusRule();
      const inc = createBaseIncident();
      inc.truthMatrix.gateway.status = 'PENDING';

      const res = rule.evaluate(inc);
      assert.strictEqual(res.status, 'INCONCLUSIVE');
      assert.ok(res.explanation.includes('Unresolved gateway status'));
    });

    it('Rule 3 (MerchantDbStatusRule): evaluates orderStatus from merchant DB', () => {
      const rule = new MerchantDbStatusRule();
      const inc = createBaseIncident();

      const res = rule.evaluate(inc);
      assert.strictEqual(res.status, 'PASS');
      assert.strictEqual(res.observedValue, 'UNPAID');

      delete inc.truthMatrix.merchantDb;
      const resMissing = rule.evaluate(inc);
      assert.strictEqual(resMissing.status, 'FAIL');
    });

    it('Rule 4 (BankEvidenceRule): differentiates confirmed debit vs decline vs missing', () => {
      const rule = new BankEvidenceRule();
      const inc = createBaseIncident();

      // Confirmed debit
      inc.truthMatrix.bank.status = 'DEBITED';
      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      // Confirmed decline
      inc.truthMatrix.bank.status = 'DECLINED';
      const resDeclined = rule.evaluate(inc);
      assert.strictEqual(resDeclined.status, 'FAIL');
      assert.ok(resDeclined.explanation.includes('Bank confirmed transaction rejection'));

      // Missing bank record -> INCONCLUSIVE (not assumed failure!)
      delete inc.truthMatrix.bank;
      const resMissing = rule.evaluate(inc);
      assert.strictEqual(resMissing.status, 'INCONCLUSIVE');
      assert.ok(resMissing.explanation.includes('not currently available'));
    });

    it('Rule 5 (AmountConsistencyRule): passes on exact parity and fails on discrepancy', () => {
      const rule = new AmountConsistencyRule();
      const inc = createBaseIncident();

      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      inc.truthMatrix.bank.amount = 9000; // mismatch
      const resMismatch = rule.evaluate(inc);
      assert.strictEqual(resMismatch.status, 'FAIL');
      assert.ok(resMismatch.explanation.includes('Amount discrepancy found'));
    });

    it('Rule 5 (AmountConsistencyRule): handles DUPLICATE_PAYMENT 2x parity branch', () => {
      const rule = new AmountConsistencyRule();
      const inc = createBaseIncident({
        aiAnalysis: { category: 'DUPLICATE_PAYMENT', confidence: 95 }
      });
      inc.truthMatrix.merchantDb.amount = 5000;
      inc.truthMatrix.bank.amount = 10000;
      inc.truthMatrix.gateway.amount = 10000;

      const res = rule.evaluate(inc);
      assert.strictEqual(res.status, 'PASS');
      assert.ok(res.explanation.includes('Duplicate payment parity verified'));
    });

    it('Rule 6 (CurrencyConsistencyRule): validates base currency INR and rejects foreign', () => {
      const rule = new CurrencyConsistencyRule();
      const inc = createBaseIncident();

      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      inc.currency = 'USD';
      const resUsd = rule.evaluate(inc);
      assert.strictEqual(resUsd.status, 'FAIL');
      assert.ok(resUsd.explanation.includes('Currency discrepancy'));
    });

    it('Rule 7 (WebhookConsistencyRule): validates cryptographic signature', () => {
      const rule = new WebhookConsistencyRule();
      const inc = createBaseIncident();

      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      inc.truthMatrix.gateway.signatureValid = false;
      const resForged = rule.evaluate(inc);
      assert.strictEqual(resForged.status, 'FAIL');
      assert.ok(resForged.explanation.includes('cryptographic HMAC signature verification failed'));
    });

    it('Rule 8 (DuplicateDetectionRule): detects already repaired and re-reconciliation', () => {
      const rule = new DuplicateDetectionRule();
      const inc = createBaseIncident();

      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      inc.isRepaired = true;
      const resRepaired = rule.evaluate(inc);
      assert.strictEqual(resRepaired.status, 'FAIL');
      assert.ok(resRepaired.explanation.includes('already executed previously'));
    });

    it('Rule 9 (EvidenceCompletenessRule): marks missing bank as inconclusive and missing gateway as fail', () => {
      const rule = new EvidenceCompletenessRule();
      const inc = createBaseIncident();

      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      // Missing bank statement -> INCONCLUSIVE (partial evidence)
      delete inc.truthMatrix.bank;
      const resNoBank = rule.evaluate(inc);
      assert.strictEqual(resNoBank.status, 'INCONCLUSIVE');

      // Missing gateway -> FAIL (critical missing evidence)
      delete inc.truthMatrix.gateway;
      const resNoGw = rule.evaluate(inc);
      assert.strictEqual(resNoGw.status, 'FAIL');
    });

    it('Rule 10 (RiskBlockingRule): permanently blocks PHANTOM_CREDIT_DESYNC and contradictory merchant failed state', () => {
      const rule = new RiskBlockingRule();
      const inc = createBaseIncident();

      assert.strictEqual(rule.evaluate(inc).status, 'PASS');

      // Phantom credit: Gateway FAILED but merchant PAID
      inc.truthMatrix.gateway.status = 'FAILED';
      inc.truthMatrix.merchantDb.orderStatus = 'PAID';
      const resPhantom = rule.evaluate(inc);
      assert.strictEqual(resPhantom.status, 'FAIL');
      assert.ok(resPhantom.explanation.includes('CRITICAL RISK: PHANTOM_CREDIT_DESYNC'));

      // Contradictory: Gateway CAPTURED but merchant explicitly FAILED
      inc.truthMatrix.gateway.status = 'CAPTURED';
      inc.truthMatrix.merchantDb.orderStatus = 'FAILED';
      const resContradictory = rule.evaluate(inc);
      assert.strictEqual(resContradictory.status, 'FAIL');
      assert.ok(resContradictory.explanation.includes('Contradictory evidence'));
    });
  });

  describe('Section 2: Engine Status Classification (ReconciliationStatus)', () => {
    const engine = new ReconciliationEngine();

    it('1. RECONCILIATION_REQUIRED: Gateway CAPTURED + Merchant UNPAID', () => {
      const inc = createBaseIncident();
      const res = engine.reconcile(inc);

      assert.strictEqual(res.reconciliationStatus, 'RECONCILIATION_REQUIRED');
      assert.strictEqual(res.criticalRulesPassed, true);
      assert.strictEqual(res.canSafeRepair, true);
      assert.strictEqual(res.recommendedAction, 'MARK_ORDER_PAID');
    });

    it('2. VERIFIED: Merchant order already PAID with matching capture', () => {
      const inc = createBaseIncident();
      inc.truthMatrix.merchantDb.orderStatus = 'PAID';

      const res = engine.reconcile(inc);
      assert.strictEqual(res.reconciliationStatus, 'VERIFIED');
      assert.strictEqual(res.canSafeRepair, false, 'Already paid orders do not require repair');
    });

    it('3. BLOCKED: PHANTOM_CREDIT_DESYNC hard safety barrier', () => {
      const inc = createBaseIncident({
        aiAnalysis: { category: 'PHANTOM_CREDIT_DESYNC', confidence: 99 }
      });
      inc.truthMatrix.gateway.status = 'FAILED';
      inc.truthMatrix.merchantDb.orderStatus = 'PAID';

      const res = engine.reconcile(inc);
      assert.strictEqual(res.reconciliationStatus, 'BLOCKED');
      assert.strictEqual(res.canSafeRepair, false);
      assert.strictEqual(res.recommendedAction, 'ESCALATE_MANUAL_REVIEW');
      assert.ok(res.rejectionReason.includes('CRITICAL RISK'));
    });

    it('4. MANUAL_REVIEW: Gateway CAPTURED, Merchant PAID, Amount MISMATCH', () => {
      const inc = createBaseIncident();
      inc.truthMatrix.merchantDb.orderStatus = 'PAID';
      inc.truthMatrix.gateway.amount = 4000; // mismatch vs 8500

      const res = engine.reconcile(inc);
      assert.strictEqual(res.reconciliationStatus, 'MANUAL_REVIEW');
      assert.strictEqual(res.canSafeRepair, false);
      assert.strictEqual(res.criticalRulesPassed, false);
    });

    it('5. MANUAL_REVIEW: Gateway CAPTURED, Merchant FAILED, Bank SUCCESS (Contradictory)', () => {
      const inc = createBaseIncident();
      inc.truthMatrix.gateway.status = 'CAPTURED';
      inc.truthMatrix.merchantDb.orderStatus = 'FAILED';
      inc.truthMatrix.bank.status = 'DEBITED';

      const res = engine.reconcile(inc);
      assert.strictEqual(res.reconciliationStatus, 'MANUAL_REVIEW');
      assert.strictEqual(res.canSafeRepair, false);
    });

    it('6. MANUAL_REVIEW: TRANSIENT_WEBHOOK_DELAY holds state for delivery', () => {
      const inc = createBaseIncident({
        aiAnalysis: { category: 'TRANSIENT_WEBHOOK_DELAY', confidence: 90 }
      });

      const res = engine.reconcile(inc);
      assert.strictEqual(res.reconciliationStatus, 'MANUAL_REVIEW');
      assert.strictEqual(res.canSafeRepair, false);
      assert.strictEqual(res.recommendedAction, 'WAIT_AND_MONITOR');
    });

    it('7. Multiple simultaneous mismatches (Amount + Payment ID + Signature)', () => {
      const inc = createBaseIncident();
      inc.truthMatrix.gateway.amount = 999;
      inc.truthMatrix.gateway.paymentId = 'PAY_WRONG';
      inc.truthMatrix.gateway.signatureValid = false;

      const res = engine.reconcile(inc);
      assert.strictEqual(res.criticalRulesPassed, false);
      assert.strictEqual(res.canSafeRepair, false);
      assert.ok(res.ruleResults.filter(r => r.status === 'FAIL').length >= 3);
    });
  });

  describe('Section 3: Deterministic Service Integration & Telemetry', () => {
    const service = new DeterministicVerificationService();

    it('attaches reconciliationStatus and ruleResults to DeterministicVerificationResult', () => {
      const inc = createBaseIncident();
      const result = service.verifyIncident(inc);

      assert.strictEqual(result.reconciliationStatus, 'RECONCILIATION_REQUIRED');
      assert.ok(Array.isArray(result.ruleResults));
      assert.strictEqual(result.ruleResults.length, 10);

      // Verify all 10 rules ran
      const ruleIds = result.ruleResults.map(r => r.ruleId);
      assert.ok(ruleIds.includes('rule-01-payment-identity'));
      assert.ok(ruleIds.includes('rule-02-gateway-status'));
      assert.ok(ruleIds.includes('rule-03-merchant-db-status'));
      assert.ok(ruleIds.includes('rule-04-bank-evidence'));
      assert.ok(ruleIds.includes('rule-05-amount-consistency'));
      assert.ok(ruleIds.includes('rule-06-currency-consistency'));
      assert.ok(ruleIds.includes('rule-07-webhook-consistency'));
      assert.ok(ruleIds.includes('rule-08-duplicate-detection'));
      assert.ok(ruleIds.includes('rule-09-evidence-completeness'));
      assert.ok(ruleIds.includes('rule-10-risk-blocking'));
    });

    it('enriches legacy checks with observedValue, expectedValue, and sourceReference', () => {
      const inc = createBaseIncident();
      const result = service.verifyIncident(inc);

      for (const check of result.checks) {
        assert.ok(check.sourceReference, `Check ${check.id} must have sourceReference`);
        assert.notStrictEqual(check.observedValue, undefined, `Check ${check.id} must have observedValue`);
        assert.notStrictEqual(check.expectedValue, undefined, `Check ${check.id} must have expectedValue`);
      }
    });

    it('retains authoritative determination with AI completely disabled', () => {
      const inc = createBaseIncident();
      delete inc.aiAnalysis; // AI completely absent

      const result = service.verifyIncident(inc);
      assert.strictEqual(result.isVerified, true);
      assert.strictEqual(result.canSafeRepair, true);
      assert.strictEqual(result.repairActionType, 'MARK_ORDER_PAID');
    });

    it('prevents false-positive verification across contradictory scenarios', () => {
      const scenarios = [
        { desc: 'Gateway failed', mutate: (i) => i.truthMatrix.gateway.status = 'FAILED' },
        { desc: 'Signature invalid', mutate: (i) => i.truthMatrix.gateway.signatureValid = false },
        { desc: 'Currency USD', mutate: (i) => i.currency = 'USD' },
        { desc: 'Amount discrepancy', mutate: (i) => i.truthMatrix.bank.amount = 1000 },
        { desc: 'Payment ID mismatch', mutate: (i) => i.truthMatrix.gateway.paymentId = 'PAY_MISMATCH' },
        { desc: 'Missing gateway', mutate: (i) => delete i.truthMatrix.gateway },
        { desc: 'Missing merchantDb', mutate: (i) => delete i.truthMatrix.merchantDb }
      ];

      for (const s of scenarios) {
        const inc = createBaseIncident();
        s.mutate(inc);
        const result = service.verifyIncident(inc);
        assert.strictEqual(result.canSafeRepair, false, `Failed safety invariant for scenario: ${s.desc}`);
        assert.strictEqual(result.isVerified, false, `Failed verification invariant for scenario: ${s.desc}`);
      }
    });
  });
});
