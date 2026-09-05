import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { ApiResponse } from '../../common/utils/api-response';

export class PaymentsController {
  private paymentsService = PaymentsService.getInstance();

  getAll = (req: Request, res: Response) => {
    const status = req.query.status as string; const method = req.query.method as string; const query = req.query.query as string;
    const payments = this.paymentsService.getPayments({
      status: status as string,
      method: method as string,
      query: query as string
    });
    return ApiResponse.success(res, payments);
  };

  getById = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const payment = this.paymentsService.getPaymentById(id);
    if (!payment) {
      return ApiResponse.error(res, 'Payment not found', 'NOT_FOUND', 404);
    }
    return ApiResponse.success(res, payment);
  };

  create = async (req: Request, res: Response) => {
    try {
      const { beneficiaryId, amount, currency, method, purpose, region } = req.body;
      if (!amount || amount <= 0) {
        return ApiResponse.error(res, 'Invalid transaction amount', 'VALIDATION_ERROR', 400);
      }

      const actor = (req as any).user || {
        id: 'usr_corp_maker_01',
        name: 'Aditya Sharma',
        role: 'MAKER',
        orgId: 'org_acme_corp'
      };

      const payment = await this.paymentsService.createPayment(
        { beneficiaryId, amount: Number(amount), currency: currency || 'INR', method: method || 'UPI', purpose: purpose || 'General Corporate Transfer', region },
        actor
      );

      return ApiResponse.success(res, payment, 201);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'PAYMENT_CREATION_FAILED', 500);
    }
  };

  getBeneficiaries = (req: Request, res: Response) => {
    const beneficiaries = this.paymentsService.getBeneficiaries();
    return ApiResponse.success(res, beneficiaries);
  };
}
