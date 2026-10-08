import { NextRequest, NextResponse } from 'next/server';
import { AdminCatalogStore } from '@/lib/services/admin-catalog-store';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/admin/sync-vip
 * Explicitly trigger synchronization of all services from VIP Reseller API
 */
export async function POST(req: NextRequest) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  try {
    const result = await AdminCatalogStore.syncFromVipReseller({ force: true });

    // Asynchronously synchronize active products to Supabase PostgreSQL
    if (result.success) {
      const active = AdminCatalogStore.getAllProducts({ status: 'active' });
      Promise.all(
        active.map((p) =>
          prisma.product.upsert({
            where: { id: p.id },
            update: {
              providerPrice: p.providerPrice || null,
              providerStatus: p.providerStatus || null,
              price: p.price,
              priceFormatted: p.priceFormatted,
              profitMargin: p.profitMargin ?? null,
              profitPercentage: p.profitPercentage ?? null,
              status: p.status,
              lastProviderCheck: new Date(),
            },
            create: {
              id: p.id,
              name: p.name,
              categoryId: p.category.id,
              categoryName: p.category.name,
              brand:
                p.features?.find((f) => f.startsWith('Brand:'))?.replace('Brand:', '').trim() ||
                'Apps & Streaming',
              price: p.price,
              priceFormatted: p.priceFormatted,
              description: p.description || null,
              features: p.features || [],
              status: p.status,
              imageUrl: p.imageUrl || null,
              providerPrice: p.providerPrice || null,
              providerStatus: p.providerStatus || null,
              profitMargin: p.profitMargin ?? null,
              profitPercentage: p.profitPercentage ?? null,
            },
          }).catch((err) => {
            console.warn('[SyncVIP] Prisma sync warning for product:', p.id, err);
          })
        )
      ).catch(() => {});
    }

    return NextResponse.json(
      {
        success: result.success,
        totalSynced: result.totalSynced,
        isIpBlocked: result.isIpBlocked,
        blockedIp: result.blockedIp,
        message: result.message,
      },
      { status: result.success ? 200 : 502 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        message: `Gagal menjalankan sinkronisasi VIP Reseller: ${msg}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/sync-vip
 * Check current sync state and total products
 */
export async function GET(req: NextRequest) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  const all = AdminCatalogStore.getAllProducts();
  const active = AdminCatalogStore.getActiveProducts();

  return NextResponse.json({
    success: true,
    totalProducts: all.length,
    activeProducts: active.length,
    timestamp: new Date().toISOString(),
  });
}
