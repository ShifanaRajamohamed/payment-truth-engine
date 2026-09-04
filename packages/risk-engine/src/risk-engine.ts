import { RiskAssessment } from '@deepaudit/shared-types';
import { EvaluationContext } from './risk.types';
import { detectAmountSignals } from './signals/amount.signal';
import { detectBeneficiarySignals } from './signals/beneficiary.signal';
import { detectDeviceSignals } from './signals/device.signal';
import { detectLocationSignals } from './signals/location.signal';
import { detectTimingSignals } from './signals/timing.signal';
import { detectBehaviorSignals } from './signals/behavior.signal';
import { ScoringEngine } from './scoring/scoring-engine';
import { RiskPolicyEngine } from './policies/risk-policy';

export class RiskEngine {
  /**
   * Deterministic evaluation of payment risk.
   * Gemini only explains the risk — it does NOT independently calculate or authorize scores.
   */
  static assess(ctx: EvaluationContext): RiskAssessment {
    const signals = [
      ...detectAmountSignals(ctx),
      ...detectBeneficiarySignals(ctx),
      ...detectDeviceSignals(ctx),
      ...detectLocationSignals(ctx),
      ...detectTimingSignals(ctx),
      ...detectBehaviorSignals(ctx),
    ];

    const { overallScore, level } = ScoringEngine.compute(signals);
    const policyDecision = RiskPolicyEngine.evaluatePolicy(
      level,
      overallScore,
      ctx.payment.amount || 0
    );

    return {
      id: `risk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      paymentId: ctx.payment.id || `temp_pay_${Date.now()}`,
      overallScore,
      level,
      actionRequired: policyDecision.action,
      signals,
      calculatedAt: new Date().toISOString()
    };
  }
}
