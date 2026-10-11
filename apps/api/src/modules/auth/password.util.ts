import * as crypto from 'crypto';

/**
 * Hashes a plaintext password using Node.js native crypto.scryptSync (salt + scrypt).
 * Generates an OWASP-recommended, memory-hard hash without external binary dependencies.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored password hash.
 * Supports scrypt format, and timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash || !password) return false;

  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHashHex] = parts;
    try {
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'utf-8');
      const expectedBuffer = Buffer.from(expectedHashHex, 'utf-8');

      if (keyBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(keyBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  // Fallback for legacy / initial plain passwords if any existed
  return storedHash === password;
}
