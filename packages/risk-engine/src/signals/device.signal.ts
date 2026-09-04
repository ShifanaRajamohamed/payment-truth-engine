import { RiskSignal } from '@deepaudit/shared-types';
import { EvaluationContext } from '../risk.types';

export function detectDeviceSignals(ctx: EvaluationContext): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const fingerprint = ctx.requestContext?.deviceFingerprint || ctx.payment.deviceFingerprint;

  // Signal: Unknown/untrusted device fingerprint
  if (fingerprint && fingerprint.startsWith('fp_unrecognized_')) {
    signals.push({
      id: `sig_dev_unrec_${Date.now()}`,
      type: 'DEVICE_UNKNOWN_FINGERPRINT',
      severity: 'MEDIUM',
      weight: 20,
      scoreContribution: 20,
      title: 'Unrecognized Device Fingerprint',
      description: 'Transaction originated from a new browser session or unrecognized hardware profile.',
      detectedAt: new Date().toISOString(),
      metadata: { fingerprint }
    });
  }

  return signals;
}
