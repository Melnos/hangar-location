export function hashPassword(password: string): string {
  try {
    return btoa(password);
  } catch {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
