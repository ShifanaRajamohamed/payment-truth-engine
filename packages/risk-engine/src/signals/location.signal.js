"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLocationSignals = detectLocationSignals;
function detectLocationSignals(ctx) {
    const signals = [];
    const currentRegion = ctx.payment.region || ctx.requestContext?.locationCity;
    // Impossible travel detection against last recent payment
    if (ctx.historicalPayments && ctx.historicalPayments.length > 0 && currentRegion) {
        const lastPayment = ctx.historicalPayments[0];
        if (lastPayment && lastPayment.region && lastPayment.region !== currentRegion) {
            const timeDiffMinutes = (Date.now() - new Date(lastPayment.createdAt).getTime()) / (1000 * 60);
            // If payment originated from different state/city within 15 minutes
            if (timeDiffMinutes < 15) {
                signals.push({
                    id: `sig_loc_speed_${Date.now()}`,
                    type: 'LOCATION_IMPOSSIBLE_TRAVEL',
                    severity: 'HIGH',
                    weight: 35,
                    scoreContribution: 35,
                    title: 'Impossible Geographic Velocity',
                    description: `Disbursement originated from ${currentRegion} just ${Math.round(timeDiffMinutes)} minutes after prior activity in ${lastPayment.region}.`,
                    detectedAt: new Date().toISOString(),
                    metadata: { previousRegion: lastPayment.region, currentRegion, timeDiffMinutes }
                });
            }
        }
    }
    return signals;
}
