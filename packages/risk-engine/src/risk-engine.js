"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEngine = void 0;
const amount_signal_1 = require("./signals/amount.signal");
const beneficiary_signal_1 = require("./signals/beneficiary.signal");
const device_signal_1 = require("./signals/device.signal");
const location_signal_1 = require("./signals/location.signal");
const timing_signal_1 = require("./signals/timing.signal");
const behavior_signal_1 = require("./signals/behavior.signal");
const scoring_engine_1 = require("./scoring/scoring-engine");
const risk_policy_1 = require("./policies/risk-policy");
class RiskEngine {
    /**
     * Deterministic evaluation of payment risk.
     * Gemini only explains the risk — it does NOT independently calculate or authorize scores.
     */
    static assess(ctx) {
        const signals = [
            ...(0, amount_signal_1.detectAmountSignals)(ctx),
            ...(0, beneficiary_signal_1.detectBeneficiarySignals)(ctx),
            ...(0, device_signal_1.detectDeviceSignals)(ctx),
            ...(0, location_signal_1.detectLocationSignals)(ctx),
            ...(0, timing_signal_1.detectTimingSignals)(ctx),
            ...(0, behavior_signal_1.detectBehaviorSignals)(ctx),
        ];
        const { overallScore, level } = scoring_engine_1.ScoringEngine.compute(signals);
        const policyDecision = risk_policy_1.RiskPolicyEngine.evaluatePolicy(level, overallScore, ctx.payment.amount || 0);
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
exports.RiskEngine = RiskEngine;
