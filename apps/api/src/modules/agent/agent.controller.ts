import { Request, Response } from 'express';
import { AgentService } from './agent.service';
import { ApiResponse } from '../../common/utils/api-response';

export class AgentController {
  private agentService = AgentService.getInstance();

  query = async (req: Request, res: Response) => {
    try {
      const { query, languageCode, conversationHistory, activeTopic } = req.body;
      if (!query || typeof query !== 'string') {
        return ApiResponse.error(res, 'Query string is required', 'VALIDATION_ERROR', 400);
      }

      const actor = (req as any).user;
      const response = await this.agentService.processQuery(
        query,
        languageCode || 'en',
        actor,
        conversationHistory,
        activeTopic
      );
      return ApiResponse.success(res, response);
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'AGENT_PROCESSING_FAILED', 500);
    }
  };

  explainRisk = async (req: Request, res: Response) => {
    try {
      const { paymentId, languageCode } = req.body;
      if (!paymentId) {
        return ApiResponse.error(res, 'paymentId is required', 'VALIDATION_ERROR', 400);
      }

      const actor = (req as any).user;
      const explanation = await this.agentService.explainPaymentRisk(paymentId, languageCode || 'en', actor);
      return ApiResponse.success(res, { paymentId, explanation });
    } catch (err: any) {
      return ApiResponse.error(res, err.message, 'EXPLANATION_FAILED', 500);
    }
  };
}
