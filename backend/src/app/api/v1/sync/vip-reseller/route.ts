import { NextRequest, NextResponse } from 'next/server';
import { VipCatalogStore } from '@/lib/services/vip-catalog-store';
import { vipResellerService } from '@/lib/services/vip-reseller.service';

/**
 * GET /api/v1/sync/vip-reseller
 * Returns synchronization status, account balance, and cache metadata
 */
export async function GET() {
  try {
    const cacheState = VipCatalogStore.getCacheState();
    let accountProfile = null;

    try {
      const profileRes = await vipResellerService.getProfile();
      if (profileRes.result) {
        accountProfile = profileRes.data;
      }
    } catch {
      // Profile fetch optional on status check
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          cache: {
            totalProducts: cacheState.products.length,
            totalRawFetched: cacheState.totalRaw,
            totalMapped: cacheState.totalMapped,
            lastSyncedAt: cacheState.lastSyncedAt,
            isSyncing: cacheState.isSyncing,
            lastError: cacheState.lastError,
          },
          provider: {
            connected: !!accountProfile,
            account: accountProfile,
          },
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        message: `Gagal membaca status sinkronisasi: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/sync/vip-reseller
 * Trigger manual or scheduled product synchronization from VIP Reseller
 */
export async function POST(req: NextRequest) {
  try {
    // Optional secret verification for production security
    const authHeader = req.headers.get('authorization');
    const configuredSecret = process.env.VIP_RESELLER_SYNC_SECRET;

    if (configuredSecret && process.env.NODE_ENV === 'production') {
      const token = authHeader?.replace('Bearer ', '');
      if (token !== configuredSecret) {
        return NextResponse.json(
          {
            success: false,
            message: 'Otorisasi ditolak: Token sinkronisasi tidak valid.',
          },
          { status: 401 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const force = Boolean(body.force);

    const result = await VipCatalogStore.syncFromProvider(force);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: {
          totalFetched: result.totalFetched,
          totalMapped: result.totalMapped,
          cachedAt: result.cachedAt,
        },
      },
      { status: result.success ? 200 : 502 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        message: `Internal error saat sinkronisasi: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
