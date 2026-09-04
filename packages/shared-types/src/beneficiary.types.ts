export type BeneficiaryVettingStatus = 'VERIFIED' | 'UNDER_REVIEW' | 'FLAGGED' | 'NEW_COOLING_PERIOD';

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string;
  category: 'VENDOR' | 'PAYROLL' | 'UTILITY' | 'TAX' | 'INDIVIDUAL';
  status: BeneficiaryVettingStatus;
  coolingPeriodExpiresAt?: string;
  totalPaymentsVolume: number;
  paymentCount: number;
  lastPaymentDate?: string;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}
