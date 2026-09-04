import { Request, Response } from 'express';
import { AuthorizationService } from './authorization.service';
import { ApiResponse } from '../../common/utils/api-response';

export class AuthorizationController {
  private authzService = AuthorizationService.getInstance();

  verifyStepUp = async (req: Request, res: Response) => {
    try {
      const { paymentId, credential } = req.body;
      const actor = (req as any).user;
      const payment = await this.authzService.verifyStepUp(paymentId, credential, actor);
      return ApiResponse.success(res, payment);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'STEP_UP_VERIFICATION_FAILED', 400);
    }
  };

  approve = async (req: Request, res: Response) => {
    try {
      const { paymentId, comments } = req.body;
      const actor = (req as any).user;
      const payment = await this.authzService.approve({ paymentId, comments }, actor);
      return ApiResponse.success(res, payment);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'APPROVAL_FAILED', 400);
    }
  };

  reject = async (req: Request, res: Response) => {
    try {
      const { paymentId, reason } = req.body;
      const actor = (req as any).user;
      const payment = await this.authzService.reject({ paymentId, reason: reason || 'Risk policy decline' }, actor);
      return ApiResponse.success(res, payment);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'REJECTION_FAILED', 400);
    }
  };
}
