import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * GET /api/v1/admin/auth/me
 * Check current administrator session status
 */
export async function GET(req: NextRequest) {
  const session = AdminAuthService.verifyAdminSession(req);

  if (!session.valid) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sesi administrator tidak aktif atau telah kedaluwarsa.',
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    admin: {
      email: session.email,
      role: 'admin',
    },
  });
}
