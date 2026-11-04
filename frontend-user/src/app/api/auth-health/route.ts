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
  let dbUser = null;
  let dbPort = null;
  let dbParams = null;
  if (rawDbUrl) {
    try {
      const sanitized = rawDbUrl.replace(/^postgresql:\/\//, 'http://');
      const parsed = new URL(sanitized);
      dbHost = parsed.host;
      dbUser = parsed.username ? parsed.username.slice(0, 16) + '...' : null;
      dbPort = parsed.port || '5432';
      dbParams = parsed.search || null;
    } catch {
      dbHost = 'invalid-url';
    }
  }

  const rawDirectUrl = process.env.DIRECT_URL || '';
  let directHost = null;
  let directPort = null;
  if (rawDirectUrl) {
    try {
      const sanitized = rawDirectUrl.replace(/^postgresql:\/\//, 'http://');
      const parsed = new URL(sanitized);
      directHost = parsed.host;
      directPort = parsed.port || '5432';
    } catch {
      directHost = 'invalid-url';
    }
  }

  // Also test direct connection if pooled connection failed
  let directStatus = 'untested';
  let directError = null;
  let directLatencyMs: number | null = null;
  if (dbStatus === 'error' && process.env.DIRECT_URL) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const directPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DIRECT_URL,
          },
        },
      });
      const dStart = Date.now();
      await directPrisma.$queryRaw`SELECT 1 as direct_alive`;
      directLatencyMs = Date.now() - dStart;
      directStatus = 'connected';
      await directPrisma.$disconnect();
    } catch (dErr: unknown) {
      directStatus = 'error';
      const errorObj = dErr as { message?: string } | null;
      directError = errorObj?.message || String(dErr);
    }
  }

  const envCheck = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseHost: dbHost,
    databaseUser: dbUser,
    databasePort: dbPort,
    databaseParams: dbParams,
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    directHost: directHost,
    directPort: directPort,
    directStatus,
    directLatencyMs,
    directError,
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

