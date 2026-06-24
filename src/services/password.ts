// Password hashing using bcryptjs (pure JS — no native binding, so it runs on
// any Node host incl. Railway). Cost factor 12 is a sensible 2025 default.
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// bcrypt hashes always start with $2a$/$2b$/$2y$. Used to detect and reject
// legacy base64 "hashes" from the pre-hardening implementation.
const BCRYPT_PREFIX = /^\$2[aby]\$/;

export function isBcryptHash(hash: string): boolean {
  return BCRYPT_PREFIX.test(hash);
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  // Never run bcrypt.compare against a non-bcrypt (legacy) hash.
  if (!isBcryptHash(hash)) return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}
