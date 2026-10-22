import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    // Call backend logout to ensure server-side cleanup if applicable
    try {
      await fetch(`${backendUrl}/api/v1/admin/auth/logout`, {
        method: 'POST',
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });
    } catch (e) {
      console.warn('[api/auth/logout] Backend notification failed (continuing local cookie purge):', e);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sesi sales berhasil diakhiri.',
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieNames = [
      'better-auth.session_token',
      '__Secure-better-auth.session_token',
      'asterra_admin_session',
      'asterra_session',
    ];

    for (const name of cookieNames) {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err) {
    console.error('[api/auth/logout] error:', err);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses logout.' },
      { status: 500 }
    );
  }
}
