import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { getSalesBaseUrl } from '@/lib/utils/url';

/**
 * Checks for a valid Better Auth session across requests.
 * Uses official Better Auth getSessionCookie and checks standard session cookies/tokens.
 */
function getActiveAuthSession(request: NextRequest): string | null {
  // 1. Official Better Auth session cookie helper
  const betterAuthCookie = getSessionCookie(request);
  if (betterAuthCookie) return betterAuthCookie;

  // 2. Direct session cookie checks
  const token =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    request.cookies.get('asterra_admin_session')?.value ||
    request.cookies.get('asterra_session')?.value;
  if (token) return token;

  // 3. Authorization Bearer header fallback
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Next.js Network Proxy (Middleware) Interceptor
 * Handles route-level authentication, RBAC boundaries, and security headers via Better Auth.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const session = getActiveAuthSession(request);
  const isAuthenticated = Boolean(session);

  // 1. Admin Page Routes Protection (/admin/*)
  if (pathname.startsWith('/admin')) {
    const isPublicAdminRoute =
      pathname === '/admin/login' ||
      pathname === '/admin/lupa-password' ||
      pathname === '/admin/forgot-password' ||
      pathname === '/admin/reset-password';

    if (isPublicAdminRoute) {
      if (pathname === '/admin/login') {
        const isLoggedOut = request.nextUrl.searchParams.get('logged_out') === '1';
        const isSalesForbidden = request.nextUrl.searchParams.get('error') === 'sales_forbidden';

        if (isLoggedOut || isSalesForbidden) {
          const response = applySecurityHeaders(NextResponse.next());
          ['better-auth.session_token', '__Secure-better-auth.session_token', 'asterra_admin_session', 'asterra_session'].forEach(
            (cookieName) => {
              response.cookies.set(cookieName, '', { path: '/', maxAge: 0, expires: new Date(0) });
            }
          );
          return response;
        }

        if (isAuthenticated) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
      return applySecurityHeaders(NextResponse.next());
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Cross-Portal Redirect: /sales/* belongs to Sales Portal (frontend-sales)
  if (pathname.startsWith('/sales')) {
    const targetSalesUrl = new URL(pathname + search, getSalesBaseUrl());
    return NextResponse.redirect(targetSalesUrl);
  }

  // 3. Admin API Route Protection (/api/v1/admin/*)
  if (pathname.startsWith('/api/v1/admin')) {
    const isAuthRoute =
      pathname.startsWith('/api/v1/admin/auth') ||
      pathname === '/api/v1/admin/login';

    if (!isAuthRoute && !isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Sesi tidak valid atau telah berakhir.',
        },
        { status: 401 }
      );
    }
  }

  // 4. Customer Profile Protection (/profile)
  if (pathname.startsWith('/profile')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Customer Login Portal (/login)
  if (pathname === '/login') {
    if (isAuthenticated) {
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
    '/sales/:path*',
    '/api/v1/admin/:path*',
    '/profile/:path*',
    '/login',
  ],
};

export default proxy;
