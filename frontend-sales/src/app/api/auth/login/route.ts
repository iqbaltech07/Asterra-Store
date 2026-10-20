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

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const response = NextResponse.json(data, { status: 200 });

    if (data.token) {
      const isProduction = process.env.NODE_ENV === 'production';
      response.cookies.set('asterra_admin_session', data.token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 8 * 3600, // 8 jam
        path: '/',
      });
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
