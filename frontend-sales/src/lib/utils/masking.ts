/**
 * Asterra Store - Customer Identity Privacy & Masking Helper
 * Protects customer personal identifiable information (PII) on all Sales and public displays.
 * 
 * Rules:
 * - "Marchelino Kurniawan" -> "Mar***no"
 * - "Andi" -> "A***"
 * - "Budi" -> "B***"
 * - Empty / null / invalid -> "" (never invent fake identities)
 */

export function maskCustomerName(name?: string | null): string {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return '';
  }
  const clean = name.trim();
  const firstWord = clean.split(/\s+/)[0];
  if (firstWord.length <= 4) {
    return firstWord[0] + '***';
  }
  return firstWord.slice(0, 3) + '***' + firstWord.slice(-2);
}

export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return '';
  }
  const clean = email.trim();
  if (!clean.includes('@')) {
    return '';
  }
  const [local, domain] = clean.split('@');
  const maskedLocal = local.length >= 2 ? local.slice(0, 2) + '***' : local[0] + '***';
  return `${maskedLocal}@${domain}`;
}
