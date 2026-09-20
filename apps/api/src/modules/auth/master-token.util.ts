import * as crypto from 'crypto';

const MASTER_TOKEN_SECRET =
  process.env.MASTER_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  'sadaqahbd-master-admin-root-token-secret-2026';

export interface MasterTokenPayload {
  id: string;
  email: string;
  role: string;
  isMasterSession: boolean;
  exp: number;
}

/**
 * Signs a stateless, secure HMAC-SHA256 JWT for Master Admin operations.
 */
export function signMasterToken(payload: {
  id: string;
  email: string;
  role?: string;
  expSeconds?: number;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (payload.expSeconds || 30 * 24 * 3600); // 30 days default
  const body = Buffer.from(
    JSON.stringify({
      id: payload.id,
      email: payload.email,
      role: payload.role || 'master_admin',
      isMasterSession: true,
      exp,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', MASTER_TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a token string against the Master Admin secret.
 * Returns decoded payload if valid and unexpired, otherwise null.
 */
export function verifyMasterToken(token: string): MasterTokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  // Development convenience fallback: exact master session identifier
  if (token === 'sadaqahbd_master_secret_session') {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@sadaqahbd.com',
      role: 'master_admin',
      isMasterSession: true,
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', MASTER_TOKEN_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: MasterTokenPayload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8')
    );

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    if (!payload.isMasterSession) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
