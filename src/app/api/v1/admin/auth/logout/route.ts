import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/services/admin-auth.service';

/**
 * POST /api/v1/admin/auth/logout
 * Revoke administrator session and clear secure cookie
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesi administrator berhasil diakhiri.',
  });

  // Clear cookie immediately
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
