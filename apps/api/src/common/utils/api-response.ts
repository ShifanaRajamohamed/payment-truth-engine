import { Response } from 'express';

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, status: number = 200) {
    return res.status(status).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res: Response, message: string, code: string = 'BAD_REQUEST', status: number = 400, details?: any) {
    return res.status(status).json({
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString()
    });
  }
}
