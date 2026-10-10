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
      let proto = getHeader('x-forwarded-proto');
      if (!proto && request && 'url' in request && typeof (request as Request).url === 'string') {
        try {
          proto = new URL((request as Request).url).protocol.replace(':', '');
        } catch {}
      }
      if (!proto) {
        proto = host && !host.includes('localhost') && !host.includes('127.0.0.1') ? 'https' : 'http';
      }

      if (host) {
        return `${proto}://${host}`.replace(/\/+$/, '');
      }
    } catch {
      // Fallback if header inspection fails
    }
  }

  // 3. User-configured custom base URL from environment variable
  const envUrl =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_URL);

  // If deployed on Vercel, prioritize custom domains or Vercel system URLs over accidental localhost in .env
  if (envUrl) {
    if (!isVercel || (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))) {
      return envUrl.replace(/\/+$/, '');
    }
  }

  // 4. Vercel automatically injected system environment variables or known project production domain
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  }
  if (isVercel) {
    return 'https://asterrastore.biz.id';
  }

  // 5. Explicit localhost from env if in local development
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 6. Default local development URL
  return 'http://localhost:3000';
}
