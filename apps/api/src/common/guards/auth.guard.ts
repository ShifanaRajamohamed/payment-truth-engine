import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiResponse } from '../utils/api-response';
import { verifyAuthToken } from '../utils/auth-token';
import { hasPermission, Permission } from '../auth/permissions';

declare global {
  namespace Express {
    interface Request {
      user?: ReturnType<typeof verifyAuthToken>;
    }
  }
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = verifyAuthToken(token);
  if (user) {
    req.user = user;
    return next();
  }

  return ApiResponse.error(res, 'Unauthorized access token', 'UNAUTHORIZED', 401);
}

export function requirePermission(permission: Permission): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }
    if (!hasPermission(req.user, permission)) {
      return ApiResponse.error(res, 'Insufficient permissions', 'FORBIDDEN', 403);
    }
    return next();
  };
}
