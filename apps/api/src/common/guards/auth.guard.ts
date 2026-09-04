import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response';
import { verifyAuthToken } from '../utils/auth-token';

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = verifyAuthToken(token);
  if (user) {
    (req as any).user = user;
    return next();
  }

  return ApiResponse.error(res, 'Unauthorized access token', 'UNAUTHORIZED', 401);
}
