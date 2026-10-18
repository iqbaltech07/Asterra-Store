/**
 * Utility to dynamically and reliably resolve the current application Base URL
 * Handles:
 * 1. Client-side browser window.location.origin
 * 2. Incoming HTTP Request headers (x-forwarded-proto, x-forwarded-host, host) -> 100% dynamic for any domain
 * 3. Explicit NEXT_PUBLIC_APP_URL or APP_URL environment variable
 * 4. Vercel System Environment Variables (VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL)
 * 5. Fallback for local development (http://localhost:3000)
 */

export function getAppBaseUrl(
  request?: Request | { headers: Headers | Record<string, string | string[] | undefined> } | null
): string {
  // 1. Client-side browser execution: always use current browser origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 2. Incoming HTTP Request context (dynamically matches the active domain/subdomain being accessed)
  if (request && 'headers' in request) {
    try {
      const getHeader = (name: string): string | null => {
        if (!request.headers) return null;
        if (typeof (request.headers as Headers).get === 'function') {
          return (request.headers as Headers).get(name);
        }
        const val = (request.headers as Record<string, string | string[] | undefined>)[name];
        return Array.isArray(val) ? val[0] || null : (val as string) || null;
      };

      const host = getHeader('x-forwarded-host') || getHeader('host');
      const proto =
        getHeader('x-forwarded-proto') ||
        (host && !host.includes('localhost') && !host.includes('127.0.0.1') ? 'https' : 'http');

      if (host) {
        return `${proto}://${host}`.replace(/\/+$/, '');
      }
    } catch {
      // Fallback if header inspection fails
    }
  }

  // 3. User-configured custom base URL from environment variable
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 4. Default Sales Portal URL
  return process.env.NODE_ENV === 'production'
    ? 'https://sales.asterrastore.biz.id'
    : 'http://localhost:3002';
}

/**
 * Utility to reliably resolve the Customer Storefront Base URL (where retail products, checkout & cart live)
 */
export function getStoreBaseUrl(): string {
  // 1. Explicit env var
  const envStore = process.env.NEXT_PUBLIC_STORE_URL?.trim();
  if (envStore) {
    return envStore.replace(/\/+$/, '');
  }

  // 2. Client-side browser execution
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return 'https://asterrastore.biz.id';
  }

  // 3. Server-side execution
  return process.env.NODE_ENV === 'production'
    ? 'https://asterrastore.biz.id'
    : 'http://localhost:3000';
}

export const getStoreUrl = getStoreBaseUrl;

