import { Request, Response } from 'express';
import { ApiResponse } from '../../common/utils/api-response';
import crypto from 'crypto';
import { createAuthToken } from '../../common/utils/auth-token';
import { envConfig } from '../../config/env.config';

export class AuthController {
  login = (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return ApiResponse.error(res, 'Email and password are required', 'VALIDATION_ERROR', 400);
    }
    if (!envConfig.demoPassword || password !== envConfig.demoPassword) {
      return ApiResponse.error(res, 'Invalid credentials', 'UNAUTHORIZED', 401);
    }

    const name = email.split('@')[0].split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    const user = {
      id: 'usr_corp_maker_01',
      name: name || 'Aditya Sharma',
      email,
      role: 'MAKER',
      orgId: 'org_acme_corp',
      token: createAuthToken({
        id: 'usr_corp_maker_01',
        name: name || 'Aditya Sharma',
        email,
        role: 'MAKER',
        orgId: 'org_acme_corp'
      })
    };

    return ApiResponse.success(res, user);
  };

  getPasskeyChallenge = (req: Request, res: Response) => {
    // Generates 32-byte cryptographic challenge for WebAuthn/Passkey platform biometrics
    const challenge = crypto.randomBytes(32).toString('base64');
    return ApiResponse.success(res, {
      challenge,
      rpId: req.hostname || 'localhost',
      timeout: 60000
    });
  };
}
