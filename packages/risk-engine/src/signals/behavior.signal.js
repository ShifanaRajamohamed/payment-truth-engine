"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBehaviorSignals = detectBehaviorSignals;
function detectBehaviorSignals(ctx) {
    const signals = [];
    const amount = ctx.payment.amount || 0;
    const history = ctx.historicalPayments || [];
    // Signal 1: Rapid succession / Smurfing pattern (e.g. multiple transactions to same or different beneficiary within 5 min)
    const recentWithin5Min = history.filter(p => {
        const diffMin = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60);
        return diffMin <= 5;
    });
    if (recentWithin5Min.length >= 2) {
        signals.push({
            id: `sig_beh_velocity_${Date.now()}`,
            type: 'BEHAVIOR_RAPID_SUCCESSION',
            severity: 'HIGH',
            weight: 25,
            scoreContribution: 25,
            title: 'High Velocity Transfer Burst',
            description: `${recentWithin5Min.length + 1} corporate disbursements queued within a 5-minute interval.`,
            detectedAt: new Date().toISOString(),
            metadata: { burstCount: recentWithin5Min.length + 1 }
        });
    }
    // Signal 2: Split amounts just below standard reporting threshold (e.g. ₹49,000 - ₹49,999 or ₹99,000 - ₹99,999)
    if ((amount >= 48000 && amount < 50000) || (amount >= 98000 && amount < 100000)) {
        signals.push({
            id: `sig_beh_split_${Date.now()}`,
            type: 'BEHAVIOR_ROUND_NUMBER_SPLIT',
            severity: 'MEDIUM',
            weight: 20,
            scoreContribution: 20,
            title: 'Structuring Pattern Near Approval Threshold',
            description: `Amount ₹${amount.toLocaleString('en-IN')} appears intentionally structured just below statutory PAN or dual-control thresholds.`,
            detectedAt: new Date().toISOString(),
            metadata: { amount }
        });
    }
    return signals;
}
