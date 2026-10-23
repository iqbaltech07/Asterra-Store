import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Route Handler for Admin / User Session Logout.
 * Proxies session revocation to FastAPI backend and definitively expires
 * all httpOnly session cookies on the Next.js origin domain.
 */
export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // 1. Forward request to backend session revocation endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;
      if (cookieHeader) headers['Cookie'] = cookieHeader;

      await fetch(`${backendUrl}/api/v1/admin/auth/logout`, {
        method: 'POST',
        headers,
      });
    } catch (backendErr) {
      console.warn('[api/auth/logout] Backend logout call warning:', backendErr);
    }

    // 2. Construct response and definitively expire all admin & Better Auth session cookies
    const response = NextResponse.json(
      { success: true, message: 'Sesi administrator berhasil diakhiri.' },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieNames = [
      'better-auth.session_token',
      '__Secure-better-auth.session_token',
      'asterra_admin_session',
      'asterra_session',
    ];

    cookieNames.forEach((name) => {
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 0,
        expires: new Date(0),
        path: '/',
      });
    });

    return response;
  } catch (err) {
    console.error('[api/auth/logout] error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Terjadi kesalahan saat mengakhiri sesi.',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
