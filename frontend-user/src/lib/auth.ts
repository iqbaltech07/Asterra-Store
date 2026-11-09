import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/prisma';

if (!process.env.BETTER_AUTH_SECRET) {
  const fallback = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!fallback && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: BETTER_AUTH_SECRET or NEXTAUTH_SECRET is required in production.');
  }
  process.env.BETTER_AUTH_SECRET = fallback || 'dev-only-better-auth-secret-key-32-chars-long!';
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: {
    allowedHosts: [
      'asterrastore.biz.id',
      'www.asterrastore.biz.id',
      'staging.asterrastore.biz.id',
      '*.asterrastore.biz.id',
      'asterrastore.vercel.app',
      'localhost:*',
      'localhost',
      '127.0.0.1:*',
      '127.0.0.1',
    ],
    protocol: 'auto',
  },
  trustedOrigins: [
    'https://asterrastore.biz.id',
    'https://www.asterrastore.biz.id',
    'https://staging.asterrastore.biz.id',
    'https://*.asterrastore.biz.id',
    'https://asterrastore.vercel.app',
    'http://localhost:*',
    'http://127.0.0.1:*',
    'https://localhost:*',
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache to avoid DB pooler starvation on frequent checks
    },
  },
  account: {
    storeStateStrategy: 'cookie',
  },
  onAPIError: {
    onError: (error) => {
      console.error('[BetterAuth:APIError]', error);
    },
    errorURL: '/login',
    throw: false,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
      accessType: 'offline',
      prompt: 'select_account consent',
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
              signal: AbortSignal.timeout(5000),
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
    // Strictly host-only cookies: crossSubDomainCookies is disabled to prevent
    // staging vs production vs admin session collisions and accidental cookie destruction.
  },
});
