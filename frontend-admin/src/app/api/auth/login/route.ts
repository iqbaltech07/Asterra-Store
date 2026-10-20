import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl =
      process.env.BACKEND_URL || 'http://localhost:8000';

    const backendRes = await fetch(`${backendUrl}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data;
    const contentType = backendRes.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await backendRes.json();
    } else {
      const text = await backendRes.text();
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: text || 'Backend error',
          },
        },
        { status: backendRes.status || 502 }
      );
    }

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const response = NextResponse.json(data, { status: 200 });

    if (data.token) {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOpts = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        maxAge: 8 * 3600, // 8 jam
        path: '/',
      };

      // Better Auth standard session cookies
      response.cookies.set('better-auth.session_token', data.token, cookieOpts);
      if (isProduction) {
        response.cookies.set('__Secure-better-auth.session_token', data.token, cookieOpts);
      }
      // Backward compatibility for backend proxy rewrite
      response.cookies.set('asterra_admin_session', data.token, cookieOpts);
    }

    return response;
  } catch (err) {
    console.error('[api/auth/login] error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Terjadi kesalahan pada server autentikasi.',
        },
      },
      { status: 500 }
    );
  }
}
