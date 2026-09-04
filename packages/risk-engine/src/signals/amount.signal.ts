import { RiskSignal } from '@deepaudit/shared-types';
import { EvaluationContext } from '../risk.types';

export function detectAmountSignals(ctx: EvaluationContext): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const amount = ctx.payment.amount || 0;
  const orgThreshold = ctx.organization?.maxSingleTxAmount || 500000;
  const dualControlThreshold = ctx.organization?.dualControlThreshold || 100000;

  // Signal 1: Exceeds organization threshold
  if (amount > orgThreshold) {
    signals.push({
      id: `sig_amt_thresh_${Date.now()}`,
      type: 'AMOUNT_THRESHOLD_EXCEEDED',
      severity: 'HIGH',
      weight: 35,
      scoreContribution: 35,
      title: 'Transfer Amount Exceeds Corporate Threshold',
      description: `Payment of ₹${amount.toLocaleString('en-IN')} exceeds single transaction limit of ₹${orgThreshold.toLocaleString('en-IN')}.`,
      detectedAt: new Date().toISOString(),
      metadata: { amount, threshold: orgThreshold }
    });
  } else if (amount >= dualControlThreshold) {
    signals.push({
      id: `sig_amt_dual_${Date.now()}`,
      type: 'AMOUNT_THRESHOLD_EXCEEDED',
      severity: 'MEDIUM',
      weight: 15,
      scoreContribution: 15,
      title: 'High-Value Corporate Disbursement',
      description: `Payment of ₹${amount.toLocaleString('en-IN')} meets or exceeds the mandatory dual-approval threshold of ₹${dualControlThreshold.toLocaleString('en-IN')}.`,
      detectedAt: new Date().toISOString(),
      metadata: { amount, threshold: dualControlThreshold }
    });
  }

  // Signal 2: Anomaly relative to historical beneficiary payments
  if (ctx.historicalPayments && ctx.historicalPayments.length > 0) {
    const beneficiaryTxs = ctx.historicalPayments.filter(
      p => p.beneficiaryId === ctx.payment.beneficiaryId && p.status === 'SUCCESS'
    );
    if (beneficiaryTxs.length >= 3) {
      const avg = beneficiaryTxs.reduce((sum, p) => sum + p.amount, 0) / beneficiaryTxs.length;
      if (amount > avg * 3) {
        signals.push({
          id: `sig_amt_anomaly_${Date.now()}`,
          type: 'AMOUNT_ANOMALY_HISTORICAL',
          severity: 'HIGH',
          weight: 25,
          scoreContribution: 25,
          title: '300%+ Spike Above Historical Average',
          description: `Transfer is ${(amount / avg).toFixed(1)}x higher than average past disbursements (₹${Math.round(avg).toLocaleString('en-IN')}) for this beneficiary.`,
          detectedAt: new Date().toISOString(),
          metadata: { amount, averageAmount: avg, ratio: amount / avg }
        });
      }
    }
  }

  return signals;
}
