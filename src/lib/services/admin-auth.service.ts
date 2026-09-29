import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'asterra_admin_session';
export const ADMIN_SESSION_DURATION_SEC = 8 * 60 * 60; // 8 hours

export interface AdminSessionPayload {
  email: string;
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export class AdminAuthService {
  private static getAdminEmail(): string {
    return process.env.ADMIN_EMAIL || 'admin@asterra.store';
  }

  private static getAdminPassword(): string {
    return process.env.ADMIN_PASSWORD || 'AsterraAdmin#2026';
  }

  private static getSecret(): string {
    return (
      process.env.ADMIN_SESSION_SECRET ||
      process.env.JWT_SECRET ||
      'asterra_admin_fallback_secret_production_2026'
    );
  }

  /**
   * Validate provided admin credentials with constant-time equality check
   */
  public static validateCredentials(emailInput: string, passwordInput: string): boolean {
    if (!emailInput || !passwordInput) return false;

    const expectedEmail = this.getAdminEmail().toLowerCase().trim();
    const cleanEmail = emailInput.toLowerCase().trim();

    if (cleanEmail !== expectedEmail) {
      return false;
    }

    const expectedPassword = this.getAdminPassword();
    const expectedBuf = Buffer.from(expectedPassword);
    const inputBuf = Buffer.from(passwordInput);

    if (expectedBuf.length !== inputBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, inputBuf);
  }

  /**
   * Create a cryptographically signed session token
   */
  public static createSessionToken(email: string): string {
    const payload: AdminSessionPayload = {
      email: email.toLowerCase().trim(),
      role: 'admin',
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
  ): { valid: boolean; email?: string } {
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

      if (payload.role !== 'admin') {
        return { valid: false };
      }

      if (Date.now() > payload.expiresAt) {
        return { valid: false }; // Expired
      }

      const adminEmail = this.getAdminEmail().toLowerCase().trim();
      if (payload.email !== adminEmail) {
        return { valid: false };
      }

      return { valid: true, email: payload.email };
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
  ): { valid: boolean; email?: string } {
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
  public static getCookieOptions() {
    const isHttps =
      process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') &&
      !process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
    const isProduction = process.env.NODE_ENV === 'production' && isHttps;
    return {
      name: ADMIN_COOKIE_NAME,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: ADMIN_SESSION_DURATION_SEC,
    };
  }
}
