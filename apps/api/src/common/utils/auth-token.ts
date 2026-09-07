import crypto from 'crypto';
import { UserRole } from '@deepaudit/shared-types';
import { envConfig } from '../../config/env.config';

export interface AuthTokenPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  exp: number;
}

const validRoles: readonly UserRole[] = ['MAKER', 'CHECKER', 'ADMIN', 'AUDITOR'];

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
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSignature] = parts;
  if (!encodedPayload || !providedSignature) return null;

  try {
    const expectedSignature = signatureFor(encodedPayload);
    const provided = Buffer.from(providedSignature, 'base64url');
    const expected = Buffer.from(expectedSignature, 'base64url');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as Partial<AuthTokenPayload>;
    if (
      typeof payload.id !== 'string' || !payload.id ||
      typeof payload.name !== 'string' || !payload.name ||
      typeof payload.email !== 'string' || !payload.email ||
      typeof payload.orgId !== 'string' || !payload.orgId ||
      typeof payload.exp !== 'number' || !Number.isInteger(payload.exp) ||
      !validRoles.includes(payload.role as UserRole)
    ) return null;

    return payload.exp > Math.floor(Date.now() / 1000) ? payload as AuthTokenPayload : null;
  } catch {
    return null;
  }
}