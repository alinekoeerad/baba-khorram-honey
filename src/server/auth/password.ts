/**
 * Password Hashing & Verification (Phase 2)
 * Primary: Argon2id (via @node-rs/argon2)
 * Fallback: Node.js crypto.scrypt (OWASP recommended parameters)
 * Constant-time comparison to prevent timing attacks.
 */

import crypto from 'crypto';

interface Argon2Module {
  hash: (password: string, options?: any) => Promise<string>;
  verify: (hash: string, password: string, options?: any) => Promise<boolean>;
}

let argon2Module: Argon2Module | null = null;
let argon2Checked = false;

async function getArgon2(): Promise<Argon2Module | null> {
  if (argon2Checked) return argon2Module;
  argon2Checked = true;
  try {
    const mod = await import('@node-rs/argon2');
    argon2Module = mod as unknown as Argon2Module;
    return argon2Module;
  } catch {
    argon2Module = null;
    return null;
  }
}

/**
 * Hashes a password using Argon2id if available, falling back to scrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const argon = await getArgon2();
  if (argon) {
    try {
      return await argon.hash(password, {
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    } catch {
      // Fallback if native execution fails
    }
  }

  // Scrypt fallback (Node.js built-in)
  return hashWithScrypt(password);
}

/**
 * Verifies a password against an Argon2id or scrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;

  // Check if hash is scrypt format
  if (hash.startsWith('$scrypt$')) {
    return verifyWithScrypt(password, hash);
  }

  // Otherwise treat as Argon2id
  const argon = await getArgon2();
  if (argon) {
    try {
      return await argon.verify(hash, password);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Internal scrypt hashing implementation
 */
function hashWithScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `$scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Internal scrypt verification with timing-safe comparison
 */
function verifyWithScrypt(password: string, hash: string): boolean {
  const parts = hash.split('$');
  if (parts.length !== 4 || parts[1] !== 'scrypt') return false;

  const salt = parts[2];
  const originalKeyHex = parts[3];
  const originalKey = Buffer.from(originalKeyHex, 'hex');

  try {
    const derivedKey = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
    return crypto.timingSafeEqual(originalKey, derivedKey);
  } catch {
    return false;
  }
}
