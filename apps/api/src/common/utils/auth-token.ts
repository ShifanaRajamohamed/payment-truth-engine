import crypto from 'crypto';
import { envConfig } from '../../config/env.config';

export interface AuthTokenPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
  exp: number;
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signatureFor(value: string): string {
  return crypto.createHmac('sha256', envConfig.jwtSecret).update(value).digest('base64url');
}

export function createAuthToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const encodedPayload = encode({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${encodedPayload}.${signatureFor(encodedPayload)}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = signatureFor(encodedPayload);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as AuthTokenPayload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}