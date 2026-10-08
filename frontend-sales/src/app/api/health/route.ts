import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Asterra Store Backend API (Next.js Route Handlers)',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    features: {
      auth: 'ready',
      catalog: 'ready',
      orders: 'ready',
      payments: 'ready',
    },
  });
}
