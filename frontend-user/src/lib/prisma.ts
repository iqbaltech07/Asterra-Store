import { PrismaClient } from '@prisma/client';

/**
 * Optimizes the PostgreSQL / Supabase connection URL for serverless environments (Vercel Lambda).
 * Ensures connection_limit=1 and appropriate timeouts to prevent pooler starvation.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw.replace(/^postgresql:\/\//, 'http://'));
    if (parsed.port === '6543' || raw.includes('pooler.supabase.com')) {
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '1');
      }
      if (!parsed.searchParams.has('connect_timeout')) {
        parsed.searchParams.set('connect_timeout', '15');
      }
      if (!parsed.searchParams.has('pool_timeout')) {
        parsed.searchParams.set('pool_timeout', '15');
      }
      return parsed.toString().replace(/^http:\/\//, 'postgresql://');
    }
  } catch {}
  return raw;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const optimizedUrl = getOptimizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: optimizedUrl ? { db: { url: optimizedUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.prisma = prisma;

