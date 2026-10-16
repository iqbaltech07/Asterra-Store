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

/**
 * Validate and sanitize redirect URLs to ensure they only point to safe internal relative paths.
 * Prevents Open Redirect vulnerabilities (e.g. //evil.com, https://evil.com, javascript:).
 */
export function getSafeInternalRedirectUrl(
  targetUrl: string | null | undefined,
  fallback: string = '/'
): string {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return fallback;
  }

  const trimmed = targetUrl.trim();
  if (!trimmed) {
    return fallback;
  }

  // Reject javascript:, data:, vbscript: protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return fallback;
  }

  // Reject protocol-relative URLs (e.g. //evil.com, /\evil.com, or \evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return fallback;
  }

  // If it is a valid relative path starting with /
  if (trimmed.startsWith('/')) {
    // Avoid redirecting to /login itself to prevent redirect loops
    if (trimmed === '/login' || trimmed.startsWith('/login?')) {
      return fallback;
    }
    return trimmed;
  }

  // If an absolute URL was passed, verify its origin matches the application domain
  try {
    const parsed = new URL(trimmed);
    const appBase = getAppBaseUrl();
    const appOrigin = new URL(appBase).origin.toLowerCase();
    const parsedOrigin = parsed.origin.toLowerCase();

    const allowedOrigins = [
      appOrigin,
      'https://asterrastore.biz.id',
      'https://www.asterrastore.biz.id',
      'https://asterrastore.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

    if (
      allowedOrigins.some(
        (allowed) => parsedOrigin === allowed || parsedOrigin.endsWith('.asterrastore.biz.id')
      )
    ) {
      const pathWithQuery = parsed.pathname + parsed.search + parsed.hash;
      if (pathWithQuery === '/login' || pathWithQuery.startsWith('/login?')) {
        return fallback;
      }
      return pathWithQuery;
    }
  } catch {
    // Parsing failed, not a valid URL
  }

  return fallback;
}

