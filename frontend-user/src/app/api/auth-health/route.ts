import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'untested';
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as alive`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (err: unknown) {
    dbStatus = 'error';
    const errorObj = err as { message?: string } | null;
    dbError = errorObj?.message || String(err);
  }

  const rawDbUrl = process.env.DATABASE_URL || '';
  let dbHost = null;
  if (rawDbUrl) {
    try {
      const sanitized = rawDbUrl.replace(/^postgresql:\/\//, 'http://');
      const parsed = new URL(sanitized);
      dbHost = parsed.host;
    } catch {
      dbHost = 'invalid-url';
    }
  }

  const envCheck = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseHost: dbHost,
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.slice(0, 12) + '...' : null,
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    hasBetterAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET),
    betterAuthUrl: process.env.BETTER_AUTH_URL || null,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'local',
  };

  const status = dbStatus === 'connected' ? 200 : 500;

  return NextResponse.json(
    {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      environment: envCheck,
    },
    { status }
  );
}

