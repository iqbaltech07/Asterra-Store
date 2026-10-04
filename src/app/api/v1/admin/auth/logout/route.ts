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

  // Clear cookie immediately using both delete and expired maxAge
  response.cookies.delete(ADMIN_COOKIE_NAME);
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
