import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { ApiResponse } from '../../common/utils/api-response';

export class AuditController {
  private auditService = AuditService.getInstance();

  getAll = (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string || '50', 10);
    const events = this.auditService.getAll(limit);
    return ApiResponse.success(res, events);
  };

  getByTargetId = (req: Request, res: Response) => {
    const targetId = req.params.targetId as string;
    const events = this.auditService.getByTargetId(targetId);
    return ApiResponse.success(res, events);
  };
}
