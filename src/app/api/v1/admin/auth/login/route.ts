import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * POST /api/v1/admin/auth/login
 * Dedicated authentication route for Asterra Store Administrator
 * Completely isolated from customer authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email dan kata sandi administrator wajib diisi.',
          },
        },
        { status: 400 }
      );
    }

    const isValid = AdminAuthService.validateCredentials(email, password);

    if (!isValid) {
      // Artificial delay (400ms) to mitigate timing attacks and brute-force attempts
      await new Promise((resolve) => setTimeout(resolve, 400));

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Kredensial administrator tidak valid atau akses ditolak.',
          },
        },
        { status: 401 }
      );
    }

    // Generate secure session token
    const token = AdminAuthService.createSessionToken(email);
    const cookieOptions = AdminAuthService.getCookieOptions();

    const response = NextResponse.json({
      success: true,
      message: 'Autentikasi Administrator Asterra berhasil.',
      token,
      admin: {
        email: email.toLowerCase().trim(),
        role: 'admin',
      },
    });

    // Set secure HttpOnly session cookie
    response.cookies.set({
      name: cookieOptions.name,
      value: token,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: `Gagal memproses autentikasi admin: ${msg}`,
        },
      },
      { status: 500 }
    );
  }
}
