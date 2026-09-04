import { RiskEngine } from '@deepaudit/risk-engine';
import { RiskAssessment, Payment, Beneficiary } from '@deepaudit/shared-types';

export class RiskService {
  private static instance: RiskService;

  static getInstance(): RiskService {
    if (!RiskService.instance) {
      RiskService.instance = new RiskService();
    }
    return RiskService.instance;
  }

  evaluate(payment: Partial<Payment>, beneficiary?: Beneficiary, historical?: Payment[]): RiskAssessment {
    return RiskEngine.assess({
      payment,
      beneficiary,
      historicalPayments: historical
    });
  }
}
