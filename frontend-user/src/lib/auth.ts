import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/utils/url';

const appBaseUrl = getAppBaseUrl();

// Ensure BETTER_AUTH_URL and secret are always populated and synced with production domain
if (!process.env.BETTER_AUTH_URL || (process.env.BETTER_AUTH_URL.includes('localhost') && (process.env.VERCEL || process.env.VERCEL_URL))) {
  process.env.BETTER_AUTH_URL = appBaseUrl;
}
if (!process.env.BETTER_AUTH_SECRET) {
  process.env.BETTER_AUTH_SECRET =
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'cabkjs.fbekjfgvesivcfsasterra2026dajcg.awid.wa!aoicgqowiqgdaigbciagdiwacamt2ru';
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appBaseUrl,
  trustedOrigins: async (request) => {
    const list: string[] = [
      'https://asterrastore.biz.id',
      'https://*.asterrastore.biz.id',
      'https://asterrastore.vercel.app',
      'https://*.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://localhost:3000',
    ];
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      list.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
    }
    if (process.env.VERCEL_URL) {
      list.push(`https://${process.env.VERCEL_URL}`);
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
      list.push(process.env.NEXT_PUBLIC_APP_URL);
    }
    if (process.env.BETTER_AUTH_URL) {
      list.push(process.env.BETTER_AUTH_URL);
    }
    if (request) {
      const origin = request.headers.get('origin');
      if (origin) list.push(origin);
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      if (host) list.push(`${proto}://${host}`);
    }
    return Array.from(new Set(list.filter(Boolean)));
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
      redirectURI: `${appBaseUrl}/api/auth/callback/google`,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'customer',
        required: false,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustedProxyHeaders: true,
  },
});
