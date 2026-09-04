import { RiskSignal, RiskLevel } from '@deepaudit/shared-types';

export interface ScoringResult {
  overallScore: number;
  level: RiskLevel;
}

export class ScoringEngine {
  /**
   * Deterministically combines detected risk signals into a bounded score (0-100)
   * and maps to categorical RiskLevel.
   */
  static compute(signals: RiskSignal[]): ScoringResult {
    if (signals.length === 0) {
      return { overallScore: 5, level: 'LOW' };
    }

    // Sum individual score contributions with diminishing returns above 75
    let rawScore = signals.reduce((sum, s) => sum + s.scoreContribution, 0);

    // Any CRITICAL signal guarantees high/critical floor
    const hasCritical = signals.some(s => s.severity === 'CRITICAL');
    if (hasCritical && rawScore < 85) {
      rawScore = Math.max(rawScore, 85);
    }

    // Bounded between 0 and 100
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let level: RiskLevel = 'LOW';
    if (finalScore >= 85) {
      level = 'CRITICAL';
    } else if (finalScore >= 60) {
      level = 'HIGH';
    } else if (finalScore >= 30) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    return { overallScore: finalScore, level };
  }
}
