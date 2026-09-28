import { NextRequest } from 'next/server';
import { POST as simulateTripay } from '../simulate-tripay/route';

/**
 * POST /api/v1/admin/orders/simulate-webhook (DEPRECATED - Replaced with Tripay)
 * Automatically forwards to Tripay Simulator.
 */
export async function POST(request: NextRequest) {
  return simulateTripay(request);
}
