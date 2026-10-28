/**
 * Asterra Store - Customer Identity Privacy & Masking Helper
 * Protects customer personal identifiable information (PII) on public displays,
 * orders lists, notifications, and portals.
 *
 * Rules:
 * - "H. Jaelani" -> "H. J******"
 * - "Marchelino Kurniawan" -> "M********* K********"
 * - "Budi" -> "B***"
 * - "Ahmad Fauzi" -> "A**** F****"
 * - Empty / null / invalid -> ""
 * - Idempotent: already masked names containing '*' are preserved without corruption.
 */

export function maskCustomerName(name?: unknown): string {
  if (name === null || name === undefined) {
    return '';
  }
  const str = String(name).trim();
  if (!str) {
    return '';
  }
  // Idempotency: if already masked, do not re-mask
  if (str.includes('*')) {
    return str;
  }

  const words = str.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }

  return words
    .map((word) => {
      // Preserve initials with period, e.g. "H." or "Dr." or "M."
      if (/^[A-Za-z]{1,2}\.$/.test(word)) {
        return word;
      }
      // Handle hyphenated names like "Siti-Nur"
      if (word.includes('-')) {
        return word
          .split('-')
          .map((sub) => {
            if (!sub) return '';
            return sub.length === 1 ? sub + '*' : sub.charAt(0) + '*'.repeat(sub.length - 1);
          })
          .join('-');
      }
      if (word.length === 1) {
        return word + '*';
      }
      return word.charAt(0) + '*'.repeat(word.length - 1);
    })
    .join(' ');
}

export function maskEmail(email?: unknown): string {
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
