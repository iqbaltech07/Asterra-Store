import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/utils/url';

const fallbackAppBaseUrl = getAppBaseUrl();

if (!process.env.BETTER_AUTH_SECRET) {
  process.env.BETTER_AUTH_SECRET =
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'cabkjs.fbekjfgvesivcfsasterra2026dajcg.awid.wa!aoicgqowiqgdaigbciagdiwacamt2ru';
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: {
    allowedHosts: [
      'asterrastore.biz.id',
      'www.asterrastore.biz.id',
      'staging.asterrastore.biz.id',
      '*.asterrastore.biz.id',
      '*.vercel.app',
      'localhost:*',
      '127.0.0.1:*',
    ],
    protocol: 'auto',
    fallback:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      fallbackAppBaseUrl ||
      'https://asterrastore.biz.id',
  },
  trustedOrigins: async (request) => {
    const list: string[] = [
      'https://asterrastore.biz.id',
      'https://*.asterrastore.biz.id',
      'https://staging.asterrastore.biz.id',
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
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'customer',
        required: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const rawBackendUrl =
              process.env.BACKEND_URL ||
              process.env.NEXT_PUBLIC_API_URL ||
              'http://localhost:8000';
            const apiUrl = rawBackendUrl.startsWith('http')
              ? rawBackendUrl
              : `https://${rawBackendUrl}`;

            await fetch(`${apiUrl}/api/v1/customer/welcome-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                name: user.name || '',
              }),
            });
            console.log(`[BetterAuth:Hook] Dispatched welcome email for new user: ${user.email}`);
          } catch (hookErr) {
            console.error('[BetterAuth:Hook] Error dispatching welcome email:', hookErr);
          }
        },
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustedProxyHeaders: true,
  },
});
