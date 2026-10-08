import { NextRequest } from 'next/server';
import { OrderEventBus, OrderEventPayload } from '@/lib/services/event-bus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/v1/events
 * Realtime Server-Sent Events (SSE) stream for admin sound alerts & live customer order tracking
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get('role') || 'client'; // 'admin' | 'user'

  let unsubscribe: (() => void) | null = null;
  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      const initMessage = `event: connected\ndata: ${JSON.stringify({
        connected: true,
        role,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // 2. Subscribe to real-time events from OrderEventBus
      unsubscribe = OrderEventBus.subscribe((event: OrderEventPayload) => {
        try {
          const sseChunk = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));
        } catch {
          // Client might have disconnected
        }
      });

      // 3. Periodic keepalive comment every 20 seconds to prevent network proxy timeout
      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
        }
      }, 20000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    },
  });

  request.signal.addEventListener('abort', () => {
    if (unsubscribe) unsubscribe();
    if (keepAliveTimer) clearInterval(keepAliveTimer);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering for Nginx/Vercel
    },
  });
}
