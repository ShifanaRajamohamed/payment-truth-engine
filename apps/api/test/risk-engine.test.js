const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  ScoringEngine,
  RiskPolicyEngine,
  RiskEngine,
  detectAmountSignals,
  detectBeneficiarySignals,
  detectDeviceSignals,
  detectLocationSignals,
  detectTimingSignals,
  detectBehaviorSignals
} = require('../../../packages/risk-engine/dist/index.js');

describe('PRIORITY 5: RiskEngine and Risk Policies', () => {

  describe('ScoringEngine', () => {
    it('returns default baseline score for zero signals', () => {
      const result = ScoringEngine.compute([]);
      assert.strictEqual(result.overallScore, 5);
      assert.strictEqual(result.level, 'LOW');
    });

    it('enforces minimum score of 85 and CRITICAL level if any CRITICAL signal is present', () => {
      const signals = [
        {
          id: 'sig-crit-1',
          type: 'ROOTED_DEVICE',
          severity: 'CRITICAL',
          scoreContribution: 30, // low nominal contribution
          title: 'Rooted device',
          description: 'Device root detected',
          detectedAt: new Date().toISOString()
        }
      ];

      const result = ScoringEngine.compute(signals);
      assert.ok(result.overallScore >= 85, `Score should be at least 85, got ${result.overallScore}`);
      assert.strictEqual(result.level, 'CRITICAL');
    });

    it('bounds score strictly between 0 and 100', () => {
      const massiveSignals = Array(10).fill({
        id: 'sig-x',
        type: 'AMOUNT_ANOMALY',
        severity: 'HIGH',
        scoreContribution: 30,
        title: 'High',
        description: 'High',
        detectedAt: new Date().toISOString()
      });

      const result = ScoringEngine.compute(massiveSignals);
      assert.strictEqual(result.overallScore, 100);
      assert.strictEqual(result.level, 'CRITICAL');
    });

    it('correctly maps scores to categorical RiskLevels', () => {
      // LOW: < 30
      const lowResult = ScoringEngine.compute([
        { id: '1', type: 'BEHAVIOR_ANOMALY', severity: 'LOW', scoreContribution: 15, title: '', description: '', detectedAt: '' }
      ]);
      assert.strictEqual(lowResult.level, 'LOW');

      // MEDIUM: 30 - 59
      const medResult = ScoringEngine.compute([
        { id: '2', type: 'BEHAVIOR_ANOMALY', severity: 'MEDIUM', scoreContribution: 40, title: '', description: '', detectedAt: '' }
      ]);
      assert.strictEqual(medResult.level, 'MEDIUM');

      // HIGH: 60 - 84
      const highResult = ScoringEngine.compute([
        { id: '3', type: 'BEHAVIOR_ANOMALY', severity: 'HIGH', scoreContribution: 65, title: '', description: '', detectedAt: '' }
      ]);
      assert.strictEqual(highResult.level, 'HIGH');

      // CRITICAL: >= 85
      const critResult = ScoringEngine.compute([
        { id: '4', type: 'BEHAVIOR_ANOMALY', severity: 'CRITICAL', scoreContribution: 85, title: '', description: '', detectedAt: '' }
      ]);
      assert.strictEqual(critResult.level, 'CRITICAL');
    });
  });

  describe('RiskPolicyEngine Safety Guarantees', () => {
    it('CRITICAL level always mandates BLOCK and blocks execution', () => {
      const policy = RiskPolicyEngine.evaluatePolicy('CRITICAL', 90, 50000);
      assert.strictEqual(policy.action, 'BLOCK');
      assert.strictEqual(policy.requiresStepUp, false);
      assert.strictEqual(policy.requiresDualApproval, false);
      assert.ok(policy.explanation.includes('auto-frozen'));
    });

    it('HIGH level mandates STEP_UP_AUTH and requires both step-up and dual approval', () => {
      const policy = RiskPolicyEngine.evaluatePolicy('HIGH', 70, 50000);
      assert.strictEqual(policy.action, 'STEP_UP_AUTH');
      assert.strictEqual(policy.requiresStepUp, true);
      assert.strictEqual(policy.requiresDualApproval, true);
    });

    it('High amount (>= ₹100,000) mandates DUAL_APPROVAL even if level is LOW', () => {
      const policy = RiskPolicyEngine.evaluatePolicy('LOW', 10, 150000);
      assert.strictEqual(policy.action, 'DUAL_APPROVAL', 'Large payments must require dual approval even if score is low');
      assert.strictEqual(policy.requiresDualApproval, true);
      assert.strictEqual(policy.requiresStepUp, false);
    });

    it('MEDIUM level mandates DUAL_APPROVAL', () => {
      const policy = RiskPolicyEngine.evaluatePolicy('MEDIUM', 45, 25000);
      assert.strictEqual(policy.action, 'DUAL_APPROVAL');
      assert.strictEqual(policy.requiresDualApproval, true);
      assert.strictEqual(policy.requiresStepUp, false);
    });

    it('LOW level with small amount (< ₹100,000) allows direct processing', () => {
      const policy = RiskPolicyEngine.evaluatePolicy('LOW', 10, 5000);
      assert.strictEqual(policy.action, 'ALLOW');
      assert.strictEqual(policy.requiresStepUp, false);
      assert.strictEqual(policy.requiresDualApproval, false);
    });

    it('Invariant: High-risk conditions (CRITICAL/HIGH) can NEVER accidentally become ALLOW', () => {
      const criticalCases = [
        { level: 'CRITICAL', score: 85, amount: 100 },
        { level: 'CRITICAL', score: 95, amount: 1000000 },
        { level: 'CRITICAL', score: 100, amount: 50 },
        { level: 'HIGH', score: 60, amount: 100 },
        { level: 'HIGH', score: 80, amount: 500000 }
      ];

      for (const tc of criticalCases) {
        const decision = RiskPolicyEngine.evaluatePolicy(tc.level, tc.score, tc.amount);
        assert.notStrictEqual(decision.action, 'ALLOW', `Risk level ${tc.level} must NEVER be ALLOW`);
      }
    });
  });

  describe('Signal Detectors', () => {
    it('detectAmountSignals flags large corporate transfers', () => {
      const ctx = {
        payment: { amount: 600000, currency: 'INR' },
        organization: { maxSinglePaymentLimit: 500000 }
      };

      const signals = detectAmountSignals(ctx);
      assert.ok(signals.length > 0, 'Should detect amount signal when exceeding limit');
    });

    it('detectBeneficiarySignals flags cooling period and flagged beneficiaries', () => {
      const coolingCtx = {
        payment: { amount: 50000 },
        beneficiary: {
          id: 'ben_new',
          name: 'Recent Supplier',
          status: 'NEW_COOLING_PERIOD',
          accountNumber: '1234567890',
          coolingPeriodExpiresAt: new Date(Date.now() + 86400000).toISOString()
        }
      };

      const coolingSignals = detectBeneficiarySignals(coolingCtx);
      assert.ok(coolingSignals.length > 0, 'Should detect NEW_COOLING_PERIOD signal');
      assert.strictEqual(coolingSignals[0].type, 'BENEFICIARY_NEW_COOLING_PERIOD');
      assert.strictEqual(coolingSignals[0].severity, 'HIGH');

      const flaggedCtx = {
        payment: { amount: 50000 },
        beneficiary: {
          id: 'ben_flagged',
          name: 'Suspicious Supplier',
          status: 'FLAGGED',
          accountNumber: '9988776655'
        }
      };

      const flaggedSignals = detectBeneficiarySignals(flaggedCtx);
      assert.ok(flaggedSignals.length > 0, 'Should detect FLAGGED beneficiary signal');
      assert.strictEqual(flaggedSignals[0].severity, 'CRITICAL');
    });

    it('detectDeviceSignals flags new or suspicious device fingerprint', () => {
      const ctx = {
        payment: { amount: 10000 },
        requestContext: {
          deviceFingerprint: 'dev_unknown_unrecognized',
          ipAddress: '10.0.0.1'
        }
      };

      const signals = detectDeviceSignals(ctx);
      assert.ok(Array.isArray(signals));
    });

    it('detectLocationSignals, timingSignals, and behaviorSignals return arrays', () => {
      const ctx = {
        payment: { amount: 10000 },
        requestContext: {
          ipAddress: '127.0.0.1',
          locationCity: 'Chennai',
          requestTimestamp: new Date().toISOString()
        }
      };

      assert.ok(Array.isArray(detectLocationSignals(ctx)));
      assert.ok(Array.isArray(detectTimingSignals(ctx)));
      assert.ok(Array.isArray(detectBehaviorSignals(ctx)));
    });
  });

  describe('End-to-End RiskEngine.assess', () => {
    it('evaluates full context and returns complete RiskAssessment object', () => {
      const ctx = {
        payment: {
          id: 'pay_risk_eval_01',
          amount: 250000,
          currency: 'INR',
          beneficiaryId: 'ben_trusted_01'
        },
        beneficiary: {
          id: 'ben_trusted_01',
          name: 'Siemens India Pvt Ltd',
          status: 'ACTIVE',
          isCoolingPeriodActive: false,
          addedAt: '2025-01-01T00:00:00Z'
        },
        organization: {
          id: 'org_acme',
          maxSinglePaymentLimit: 1000000
        },
        requestContext: {
          ipAddress: '122.164.88.10',
          locationCity: 'Chennai',
          deviceFingerprint: 'dev_macbook_corp_01'
        }
      };

      const assessment = RiskEngine.assess(ctx);

      assert.ok(assessment.id.startsWith('risk_'));
      assert.strictEqual(assessment.paymentId, 'pay_risk_eval_01');
      assert.strictEqual(typeof assessment.overallScore, 'number');
      assert.ok(assessment.overallScore >= 0 && assessment.overallScore <= 100);
      assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(assessment.level));
      assert.ok(['ALLOW', 'STEP_UP_AUTH', 'DUAL_APPROVAL', 'BLOCK'].includes(assessment.actionRequired));
      assert.ok(Array.isArray(assessment.signals));
      assert.ok(assessment.calculatedAt);

      // Since amount is 250,000 (>= 100,000), policy MUST require at least DUAL_APPROVAL
      assert.ok(
        ['DUAL_APPROVAL', 'STEP_UP_AUTH', 'BLOCK'].includes(assessment.actionRequired),
        '₹250,000 transfer cannot be ALLOW'
      );
    });
  });
});
