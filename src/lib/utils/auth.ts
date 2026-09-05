export function hashPassword(password: string): string {
  const { createHash } = require('crypto');
  return createHash('sha256').update(password).digest('hex');
}
