"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskPolicyEngine = void 0;
class RiskPolicyEngine {
    /**
     * Deterministic corporate risk policy mapping from RiskLevel to system action.
     */
    static evaluatePolicy(level, score, amount) {
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
exports.RiskPolicyEngine = RiskPolicyEngine;
