import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

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
 * Verifies a plaintext password against a stored password hash from the database.
 * Supports:
 * - Native scrypt format (scrypt:salt:hash)
 * - bcrypt format ($2a$, $2b$, $2y$)
 * - MD5 format (common in phpMyAdmin Function: MD5)
 * - SHA256 format (64 hex characters)
 * - SHA1 format (40 hex characters)
 * - MySQL legacy PASSWORD() format (*...)
 * - Plaintext fallback (direct or trimmed match)
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash || !password) return false;

  const trimmedStored = storedHash.trim();
  const trimmedPassword = password.trim();

  // 1. Direct or trimmed plain text match
  if (storedHash === password || trimmedStored === trimmedPassword) {
    return true;
  }

  // 2. Native scrypt format
  if (trimmedStored.startsWith('scrypt:')) {
    const parts = trimmedStored.split(':');
    if (parts.length === 3) {
      const [, salt, expectedHashHex] = parts;
      try {
        const derivedKey = crypto.scryptSync(password, salt, 64);
        const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'utf-8');
        const expectedBuffer = Buffer.from(expectedHashHex, 'utf-8');

        if (keyBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(keyBuffer, expectedBuffer)) {
          return true;
        }
      } catch {
        // Fallback continues
      }
    }
  }

  // 3. bcrypt format ($2a$, $2b$, $2y$)
  if (
    trimmedStored.startsWith('$2a$') ||
    trimmedStored.startsWith('$2b$') ||
    trimmedStored.startsWith('$2y$')
  ) {
    try {
      if (bcrypt.compareSync(password, trimmedStored) || bcrypt.compareSync(trimmedPassword, trimmedStored)) {
        return true;
      }
    } catch {
      // Fallback continues
    }
  }

  // 4. MD5 format (32 hex characters, e.g. from MySQL phpMyAdmin MD5 function)
  try {
    const md5A = crypto.createHash('md5').update(password).digest('hex');
    const md5B = crypto.createHash('md5').update(trimmedPassword).digest('hex');
    if (
      trimmedStored.toLowerCase() === md5A.toLowerCase() ||
      trimmedStored.toLowerCase() === md5B.toLowerCase()
    ) {
      return true;
    }
  } catch {}

  // 5. SHA256 format (64 hex characters)
  try {
    const sha256A = crypto.createHash('sha256').update(password).digest('hex');
    const sha256B = crypto.createHash('sha256').update(trimmedPassword).digest('hex');
    if (
      trimmedStored.toLowerCase() === sha256A.toLowerCase() ||
      trimmedStored.toLowerCase() === sha256B.toLowerCase()
    ) {
      return true;
    }
  } catch {}

  // 6. SHA1 format (40 hex characters)
  try {
    const sha1A = crypto.createHash('sha1').update(password).digest('hex');
    const sha1B = crypto.createHash('sha1').update(trimmedPassword).digest('hex');
    if (
      trimmedStored.toLowerCase() === sha1A.toLowerCase() ||
      trimmedStored.toLowerCase() === sha1B.toLowerCase()
    ) {
      return true;
    }
  } catch {}

  // 7. MySQL PASSWORD() format (* + SHA1(SHA1(password)))
  try {
    const pass1 = crypto.createHash('sha1').update(password).digest();
    const pass2 = '*' + crypto.createHash('sha1').update(pass1).digest('hex').toUpperCase();
    if (trimmedStored.toUpperCase() === pass2) {
      return true;
    }
  } catch {}

  return false;
}

