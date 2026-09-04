import { RiskLevel, RiskAssessment } from '@deepaudit/shared-types';

export interface PolicyActionDecision {
  action: 'ALLOW' | 'STEP_UP_AUTH' | 'DUAL_APPROVAL' | 'BLOCK';
  requiresStepUp: boolean;
  requiresDualApproval: boolean;
  explanation: string;
}

export class RiskPolicyEngine {
  /**
   * Deterministic corporate risk policy mapping from RiskLevel to system action.
   */
  static evaluatePolicy(level: RiskLevel, score: number, amount: number): PolicyActionDecision {
    if (level === 'CRITICAL') {
      return {
        action: 'BLOCK',
        requiresStepUp: false,
        requiresDualApproval: false,
        explanation: 'Transaction auto-frozen due to critical fraud anomaly. Requires Fraud Ops clearance.'
      };
    }

    if (level === 'HIGH') {
      return {
        action: 'STEP_UP_AUTH',
        requiresStepUp: true,
        requiresDualApproval: true,
        explanation: 'Elevated risk detected. Hardware passkey/biometric verification and dual checker approval required.'
      };
    }

    if (level === 'MEDIUM' || amount >= 100000) {
      return {
        action: 'DUAL_APPROVAL',
        requiresStepUp: false,
        requiresDualApproval: true,
        explanation: 'Medium risk or high value payment. Requires standard dual-control checker authorization.'
      };
    }

    return {
      action: 'ALLOW',
      requiresStepUp: false,
      requiresDualApproval: false,
      explanation: 'Low risk transaction. Standard corporate processing path.'
    };
  }
}
