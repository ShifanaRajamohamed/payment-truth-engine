export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskSignalType = 
  | 'AMOUNT_THRESHOLD_EXCEEDED'
  | 'AMOUNT_ANOMALY_HISTORICAL'
  | 'BENEFICIARY_NEW_COOLING_PERIOD'
  | 'BENEFICIARY_NAME_MISMATCH'
  | 'BENEFICIARY_VELOCITY_SPIKE'
  | 'DEVICE_UNKNOWN_FINGERPRINT'
  | 'LOCATION_IMPOSSIBLE_TRAVEL'
  | 'TIMING_OUT_OF_HOURS'
  | 'BEHAVIOR_RAPID_SUCCESSION'
  | 'BEHAVIOR_ROUND_NUMBER_SPLIT';

export interface RiskSignal {
  id: string;
  type: RiskSignalType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weight: number;
  scoreContribution: number;
  title: string;
  description: string;
  detectedAt: string;
  metadata?: Record<string, any>;
}

export interface RiskAssessment {
  id: string;
  paymentId: string;
  overallScore: number; // 0 to 100
  level: RiskLevel;
  actionRequired: 'ALLOW' | 'STEP_UP_AUTH' | 'DUAL_APPROVAL' | 'BLOCK';
  signals: RiskSignal[];
  calculatedAt: string;
  aiExplanation?: string;
}
