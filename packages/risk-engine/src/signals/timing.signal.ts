import { RiskSignal } from '@deepaudit/shared-types';
import { EvaluationContext } from '../risk.types';

export function detectTimingSignals(ctx: EvaluationContext): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const timestampStr = ctx.payment.createdAt || ctx.requestContext?.requestTimestamp || new Date().toISOString();
  const date = new Date(timestampStr);
  
  // IST hours (UTC + 5:30)
  const utcHours = date.getUTCHours();
  const istHours = (utcHours + 5.5) % 24;

  // Signal: Corporate transfers initiated between 1:00 AM and 5:00 AM
  if (istHours >= 1 && istHours <= 5 && (ctx.payment.amount || 0) > 25000) {
    signals.push({
      id: `sig_time_night_${Date.now()}`,
      type: 'TIMING_OUT_OF_HOURS',
      severity: 'MEDIUM',
      weight: 15,
      scoreContribution: 15,
      title: 'Off-Hours High-Value Authorization',
      description: `Payment initiated during off-hours (${Math.floor(istHours)}:${String(Math.floor((istHours % 1) * 60)).padStart(2, '0')} IST), deviating from standard corporate treasury windows.`,
      detectedAt: new Date().toISOString(),
      metadata: { istHours }
    });
  }

  return signals;
}
