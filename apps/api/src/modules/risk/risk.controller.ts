import { Request, Response } from 'express';
import { RiskService } from './risk.service';
import { ApiResponse } from '../../common/utils/api-response';

export class RiskController {
  private riskService = RiskService.getInstance();

  assess = (req: Request, res: Response) => {
    const { payment, beneficiary } = req.body;
    if (!payment) {
      return ApiResponse.error(res, 'Payment payload is required for risk assessment', 'VALIDATION_ERROR', 400);
    }
    const assessment = this.riskService.evaluate(payment, beneficiary);
    return ApiResponse.success(res, assessment);
  };
}
