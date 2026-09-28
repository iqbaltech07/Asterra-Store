import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export const ADMIN_COOKIE_NAME = 'asterra_admin_session';

function getAdminSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    'asterra_admin_fallback_secret_production_2026'
  );
}

/**
 * Verify cryptographically signed admin session token using standard Web Crypto API.
 * 100% compatible with Next.js Edge Runtime and Node.js runtimes.
 */
async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;

  try {
    const encoder = new TextEncoder();
    const secret = getAdminSecret();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadBase64));

    // Convert sigBuf to base64url string
    const binary = String.fromCharCode(...new Uint8Array(sigBuf));
    const expectedSignature = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (expectedSignature !== signature) {
      return false;
    }

    // Decode and validate payload expiration and role
    const jsonStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(jsonStr);

    if (payload.role !== 'admin') return false;
    if (typeof payload.expiresAt === 'number' && Date.now() > payload.expiresAt) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Next.js Network Proxy (Middleware) Interceptor
 * Handles route-level authentication, RBAC boundaries, and security headers.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  // 1. Admin Page Routes Protection (/admin/*)
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValidAdmin = await verifyAdminToken(adminToken);

    // If already logged in and visiting /admin/login -> redirect to /admin dashboard
    if (pathname === '/admin/login') {
      if (isValidAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return applySecurityHeaders(NextResponse.next());
    }

    // For any other /admin routes -> require valid admin session
    if (!isValidAdmin) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Admin API Route Protection (/api/v1/admin/*)
  if (pathname.startsWith('/api/v1/admin')) {
    // Exclude public admin auth endpoints (/api/v1/admin/auth/login, etc.)
    const isAuthRoute =
      pathname.startsWith('/api/v1/admin/auth') ||
      pathname === '/api/v1/admin/login';

    if (!isAuthRoute) {
      const adminToken =
        request.cookies.get(ADMIN_COOKIE_NAME)?.value ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

      const isValidAdmin = await verifyAdminToken(adminToken);
      if (!isValidAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Sesi administrator tidak valid atau telah berakhir.',
          },
          { status: 401 }
        );
      }
    }
  }

  // 3. Customer Profile Protection (/profile)
  if (pathname.startsWith('/profile')) {
    const customerSession = getSessionCookie(request);

    if (!customerSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Customer Login Portal (/login)
  if (pathname === '/login') {
    const customerSession = getSessionCookie(request);

    // If customer is already logged in -> redirect to /profile (or callbackUrl)
    if (customerSession) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/profile';
      const redirectUrl = new URL(callbackUrl, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

/**
 * Apply hardened security response headers
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/v1/admin/:path*',
    '/profile/:path*',
    '/login',
  ],
};

export default proxy;
