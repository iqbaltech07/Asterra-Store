import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const ADMIN_COOKIE_NAME = 'asterra_admin_session';
export const ADMIN_SESSION_DURATION_SEC = 8 * 60 * 60; // 8 hours

export interface AdminSessionPayload {
  id?: string;
  email: string;
  name?: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export class AdminAuthService {
  private static getSecret(): string {
    return (
      process.env.ADMIN_SESSION_SECRET ||
      process.env.JWT_SECRET ||
      'asterra_admin_fallback_secret_production_2026'
    );
  }

  /**
   * Validate provided admin credentials against database admin_users
   * Checks username/email, password hash (bcrypt), and isActive flag
   */
  public static async validateCredentials(
    identifierInput: string,
    passwordInput: string
  ): Promise<{
    valid: boolean;
    admin?: {
      id: string;
      username: string;
      email: string;
      name: string | null;
      role: string;
      isActive: boolean;
    };
    error?: string;
  }> {
    if (!identifierInput || !passwordInput) {
      return { valid: false, error: 'Email atau username serta kata sandi wajib diisi.' };
    }

    const clean = identifierInput.trim().toLowerCase();

    // Query database for admin user by email or username
    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { username: { equals: clean, mode: 'insensitive' } },
        ],
      },
    });

    if (!admin) {
      return {
        valid: false,
        error: 'Kredensial administrator tidak valid atau akun tidak ditemukan.',
      };
    }

    // Critical check: if admin is inactive, deny login immediately
    if (!admin.isActive) {
      return {
        valid: false,
        error: 'Akun administrator dinonaktifkan. Silakan hubungi Super Administrator.',
      };
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(passwordInput, admin.passwordHash);
    if (!isMatch) {
      return {
        valid: false,
        error: 'Kata sandi administrator salah atau tidak cocok.',
      };
    }

    return { valid: true, admin };
  }

  /**
   * Create a cryptographically signed session token
   */
  public static createSessionToken(
    admin: { id?: string; email: string; name?: string | null; role?: string } | string
  ): string {
    const email = typeof admin === 'string' ? admin : admin.email;
    const role = (typeof admin === 'object' && admin.role) || 'admin';
    const id = typeof admin === 'object' ? admin.id : undefined;
    const name = typeof admin === 'object' ? admin.name || undefined : undefined;

    const payload: AdminSessionPayload = {
      id,
      email: email.toLowerCase().trim(),
      name,
      role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + ADMIN_SESSION_DURATION_SEC * 1000,
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.getSecret())
      .update(payloadBase64)
      .digest('base64url');

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Verify session token validity, integrity, and expiration
   */
  public static verifySessionToken(
    token: string | undefined | null
  ): { valid: boolean; email?: string; id?: string; name?: string; role?: string } {
    if (!token || typeof token !== 'string') {
      return { valid: false };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false };
    }

    const [payloadBase64, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', this.getSecret())
      .update(payloadBase64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false };
    }

    try {
      const decodedJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
      const payload: AdminSessionPayload = JSON.parse(decodedJson);

      if (payload.role !== 'admin' && payload.role !== 'superadmin') {
        return { valid: false };
      }

      if (Date.now() > payload.expiresAt) {
        return { valid: false }; // Expired
      }

      if (!payload.email || typeof payload.email !== 'string') {
        return { valid: false };
      }

      return {
        valid: true,
        email: payload.email,
        id: payload.id,
        name: payload.name,
        role: payload.role,
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Extract and verify admin session from NextRequest or standard Request
   * Supports both HTTP cookie and Authorization: Bearer header
   */
  public static verifyAdminSession(
    req: NextRequest | Request
  ): { valid: boolean; email?: string; id?: string; name?: string; role?: string } {
    let token: string | undefined;

    // Check cookie
    if ('cookies' in req && typeof req.cookies?.get === 'function') {
      token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    } else {
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
        if (match) {
          token = match[1];
        }
      }
    }

    // Fallback to Bearer token
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    return this.verifySessionToken(token);
  }

  /**
   * Cookie configuration for setting the admin session cookie
   */
  public static getCookieOptions(req?: NextRequest | Request) {
    let isSecure = false;
    if (req) {
      const proto = req.headers.get('x-forwarded-proto');
      const host = req.headers.get('host') || '';
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      isSecure = !isLocal && (proto === 'https' || (req as NextRequest).nextUrl?.protocol === 'https:');
    } else {
      const isLocal = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
      isSecure =
        process.env.NODE_ENV === 'production' &&
        !isLocal &&
        (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false);
    }

    return {
      name: ADMIN_COOKIE_NAME,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: ADMIN_SESSION_DURATION_SEC,
    };
  }
}
