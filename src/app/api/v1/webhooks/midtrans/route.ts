import { NextResponse } from 'next/server';

/**
 * Midtrans Webhook Receiver (DEPRECATED)
 * Asterra Store has transitioned entirely to Tripay Payment Gateway.
 * Real webhook traffic is handled at: /api/v1/webhooks/tripay
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Gateway Midtrans telah dinonaktifkan. Asterra Store kini menggunakan Tripay Payment Gateway (/api/v1/webhooks/tripay).',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Gateway Midtrans telah dinonaktifkan. Asterra Store kini menggunakan Tripay Payment Gateway.',
    },
    { status: 410 }
  );
}
