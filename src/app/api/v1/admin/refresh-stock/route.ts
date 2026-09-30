import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { vipResellerService, VipRawService } from '@/lib/services/vip-reseller.service';
import { AdminCatalogStore } from '@/lib/services/admin-catalog-store';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * POST /api/v1/admin/refresh-stock
 * Check live stock availability and provider prices from VIP Reseller
 * for all products currently imported into the Asterra DB.
 * If supplier stock is empty, status is immediately marked as 'empty' (kosong) with stock 0.
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
    // 1. Query all products currently in Asterra DB from VIP Reseller
    const dbVipProducts = await prisma.product.findMany({
      where: {
        provider: 'vip-reseller',
        providerCode: { not: null },
      },
    });

    if (dbVipProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada produk VIP Reseller di database Asterra untuk diperiksa.',
        data: { checked: 0, updated: 0, warningsCount: 0 },
      });
    }

    // 2. Fetch live services from VIP Reseller API
    const response = await vipResellerService.getAllAggregatedServices({ forceRefresh: true });
    if (!response.result || !Array.isArray(response.data)) {
      return NextResponse.json(
        {
          success: false,
          message:
            response.message ||
            'Gagal mengambil data layanan terbaru dari gateway VIP Reseller.',
        },
        { status: 502 }
      );
    }

    const servicesMap = new Map<string, VipRawService>();
    for (const s of response.data) {
      if (s.code) {
        servicesMap.set(s.code.toUpperCase(), s);
      }
    }

    let updatedCount = 0;
    let emptyCount = 0;
    const now = new Date();

    // 3. Compare each product in DB with live VIP data and persist changes
    for (const prod of dbVipProducts) {
      if (!prod.providerCode) continue;
      const live = servicesMap.get(prod.providerCode.toUpperCase());

      if (live) {
        let basePrice = 0;
        if (typeof live.price === 'object' && live.price !== null) {
          basePrice = live.price.basic || live.price.premium || 0;
        } else if (typeof live.price === 'number') {
          basePrice = live.price;
        }

        const isAvailable = live.status === 'available';
        const providerStatus: 'available' | 'empty' = isAvailable ? 'available' : 'empty';

        // When supplier has no stock, stock is set to 0 and providerStatus to 'empty' (Kosong)
        const newStock = isAvailable ? (prod.stock === 0 ? 100 : prod.stock) : 0;

        if (!isAvailable) {
          emptyCount++;
        }

        const currentCost = basePrice || prod.providerPrice || 0;
        let profitMargin: number | null = null;
        let profitPercentage: number | null = null;
        if (currentCost > 0) {
          profitMargin = prod.price - currentCost;
          profitPercentage = Math.round((profitMargin / currentCost) * 100);
        }

        // Persist to PostgreSQL database
        await prisma.product.update({
          where: { id: prod.id },
          data: {
            providerPrice: basePrice || prod.providerPrice,
            providerStatus,
            stock: newStock,
            profitMargin,
            profitPercentage,
            lastProviderCheck: now,
          },
        });

        // Synchronize in-memory catalog store
        AdminCatalogStore.updateProduct(prod.id, {
          providerPrice: basePrice || prod.providerPrice || undefined,
          providerStatus,
          stock: newStock,
          profitMargin: profitMargin || undefined,
          profitPercentage: profitPercentage || undefined,
          lastProviderCheck: now.toISOString(),
        });

        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pengecekan stok supplier selesai. ${updatedCount} produk di database diperiksa. ${emptyCount} produk berstatus kosong/habis.`,
      data: {
        checked: dbVipProducts.length,
        updated: updatedCount,
        warningsCount: emptyCount,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal memperbarui status live supplier: ${msg}` },
      { status: 500 }
    );
  }
}
