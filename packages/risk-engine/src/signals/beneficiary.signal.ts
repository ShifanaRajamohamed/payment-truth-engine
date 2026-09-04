import { RiskSignal } from '@deepaudit/shared-types';
import { EvaluationContext } from '../risk.types';

export function detectBeneficiarySignals(ctx: EvaluationContext): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const beneficiary = ctx.beneficiary;

  if (!beneficiary) {
    return signals;
  }

  // Signal 1: New Beneficiary in Cooling Period
  if (beneficiary.status === 'NEW_COOLING_PERIOD') {
    signals.push({
      id: `sig_ben_cooling_${Date.now()}`,
      type: 'BENEFICIARY_NEW_COOLING_PERIOD',
      severity: 'HIGH',
      weight: 30,
      scoreContribution: 30,
      title: 'Beneficiary In 24-Hour Cooling Period',
      description: `Beneficiary '${beneficiary.name}' was added recently and is within statutory risk cooling period.`,
      detectedAt: new Date().toISOString(),
      metadata: { coolingExpires: beneficiary.coolingPeriodExpiresAt }
    });
  }

  // Signal 2: Flagged or Under Review Beneficiary
  if (beneficiary.status === 'FLAGGED') {
    signals.push({
      id: `sig_ben_flagged_${Date.now()}`,
      type: 'BENEFICIARY_VELOCITY_SPIKE',
      severity: 'CRITICAL',
      weight: 45,
      scoreContribution: 45,
      title: 'Beneficiary Under Compliance Flag',
      description: `Beneficiary account ${beneficiary.accountNumber.slice(-4)} is flagged for compliance or sanction review.`,
      detectedAt: new Date().toISOString(),
      metadata: { beneficiaryId: beneficiary.id }
    });
  }

  // Signal 3: Dormant beneficiary sudden activation
  if (beneficiary.lastPaymentDate) {
    const daysSinceLast = (Date.now() - new Date(beneficiary.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast > 180 && (ctx.payment.amount || 0) > 50000) {
      signals.push({
        id: `sig_ben_dormant_${Date.now()}`,
        type: 'BENEFICIARY_VELOCITY_SPIKE',
        severity: 'MEDIUM',
        weight: 15,
        scoreContribution: 15,
        title: 'Re-activated Dormant Beneficiary',
        description: `No payments sent to this recipient for over 6 months (${Math.round(daysSinceLast)} days).`,
        detectedAt: new Date().toISOString(),
        metadata: { daysSinceLast }
      });
    }
  }

  return signals;
}
