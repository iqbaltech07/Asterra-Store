'use client';

/**
 * AsterraStore Production Chunk Recovery Engine
 *
 * Handles transient ChunkLoadError exceptions caused by rolling deployments,
 * CDN edge cache invalidation, or browser-cached HTML requesting superseded chunks.
 *
 * Guarantees:
 * 1. Targeted: Only acts on genuine chunk/deployment script loading errors.
 * 2. Guarded: Uses a sessionStorage flag to prevent infinite reload loops.
 * 3. Self-healing: Automatically clears the flag once the page boots successfully.
 * 4. SSR-safe: Strictly no-op during server execution.
 */

export const CHUNK_RECOVERY_KEY = 'asterra-chunk-recovery';

const CHUNK_ERROR_PATTERNS = [
  'chunkloaderror',
  'loading chunk',
  '_next/static/chunks/',
  'failed to load chunk',
  'failed to fetch dynamically imported module',
];

/**
 * Evaluates whether an error is caused by chunk / deployment asset mismatch.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;

  let combined = '';

  if (typeof error === 'string') {
    combined = error;
  } else if (error instanceof Error) {
    combined = `${error.name} ${error.message} ${error.stack || ''}`;
  } else if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    combined = `${String(record.name || '')} ${String(record.message || '')} ${String(record.reason || '')}`;

    // Inspect script or link element target if from ErrorEvent
    const target = record.target as { src?: string; href?: string } | undefined;
    if (target) {
      if (typeof target.src === 'string') combined += ` ${target.src}`;
      if (typeof target.href === 'string') combined += ` ${target.href}`;
    }
  }

  const lower = combined.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Attempts a one-time automatic page reload if the error matches chunk failure patterns.
 * Returns true if a reload was initiated, false otherwise.
 */
export function tryRecoverFromChunkError(error: unknown): boolean {
  if (typeof window === 'undefined') return false;
  if (!isChunkLoadError(error)) return false;

  try {
    const hasAlreadyRecovered = sessionStorage.getItem(CHUNK_RECOVERY_KEY);
    if (!hasAlreadyRecovered) {
      sessionStorage.setItem(CHUNK_RECOVERY_KEY, 'true');
      window.location.reload();
      return true;
    }
  } catch {
    // Gracefully handle storage quota or disabled sessionStorage
  }

  return false;
}

/**
 * Clears the recovery flag after the page has mounted and hydrated cleanly.
 * Delayed to ensure initial render and post-mount prefetch tasks have succeeded.
 */
export function clearChunkRecoveryFlag(delayMs: number = 2500): () => void {
  if (typeof window === 'undefined') return () => {};

  const timer = setTimeout(() => {
    try {
      sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
    } catch {
      // Ignore storage errors
    }
  }, delayMs);

  return () => clearTimeout(timer);
}
