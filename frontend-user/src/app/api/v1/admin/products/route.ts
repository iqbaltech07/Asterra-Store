import { NextRequest, NextResponse } from 'next/server';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { vipResellerService } from '@/lib/services/vip-reseller.service';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/products
 * Fetch products for Admin Management with metrics, supplier statuses, and filters
 * Queries Supabase PostgreSQL with instant B-Tree index lookup.
 */
export async function GET(req: NextRequest) {
  try {
    const session = AdminAuthService.verifyAdminSession(req);
    if (!session.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') as
      | 'all'
      | 'active'
      | 'archived'
      | undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

    const { products: filteredProducts, total, metrics } =
      await PrismaCatalogRepository.getAllProductsAdmin({
        status: statusParam || 'all',
        category,
        search,
        limit,
        offset,
      });

    // Optional VIP Reseller live balance
    let vipBalance = null;
    try {
      const profile = await vipResellerService.getProfile();
      if (profile.result && profile.data) {
        vipBalance = profile.data.balance;
      }
    } catch {
      // Ignore if offline
    }

    return NextResponse.json({
      success: true,
      data: filteredProducts,
      total,
      metrics: {
        total: metrics.total,
        totalActive: metrics.active,
        totalArchived: metrics.archived,
        totalWarnings: metrics.warnings,
        vipBalance,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal memuat produk admin: ${msg}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/products
 * Create new product directly in Supabase database
 */
export async function POST(req: NextRequest) {
  try {
    const session = AdminAuthService.verifyAdminSession(req);
    if (!session.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.name || body.price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Nama produk dan harga jual retail wajib diisi.' },
        { status: 400 }
      );
    }

    const price = Number(body.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: 'Harga produk harus berupa angka valid.' },
        { status: 400 }
      );
    }

    const id = body.id || `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const category = body.category || { id: 'cat-custom', name: 'Layanan Digital' };
    const brand =
      body.features?.find((f: string) => f.startsWith('Brand:'))?.replace('Brand:', '').trim() ||
      'Custom';

    const providerPrice = body.providerPrice ? Number(body.providerPrice) : null;
    let profitMargin: number | null = null;
    let profitPercentage: number | null = null;
    if (providerPrice && providerPrice > 0) {
      profitMargin = price - providerPrice;
      profitPercentage = Math.round((profitMargin / providerPrice) * 100);
    }

    const newProduct = await prisma.product.create({
      data: {
        id,
        name: body.name,
        categoryId: category.id,
        categoryName: category.name,
        brand,
        price,
        priceFormatted: `Rp ${Math.round(price / 1000)} Rb`,
        description: body.description || '',
        features: Array.isArray(body.features)
          ? body.features
          : [body.features || 'Aktivasi cepat & garansi resmi'],
        status: body.status || 'active',
        stock: body.stock !== undefined ? Math.max(0, Number(body.stock)) : 100,
        imageUrl:
          body.imageUrl ||
          '/images/default-product-banner.png',
        popular: Boolean(body.popular),
        provider: body.provider || 'native',
        providerCode: body.providerCode || null,
        providerPrice,
        profitMargin,
        profitPercentage,
        guaranteeTitle: body.guaranteeTitle !== undefined ? body.guaranteeTitle : null,
        guaranteeDesc: body.guaranteeDesc !== undefined ? body.guaranteeDesc : null,
        processTitle: body.processTitle !== undefined ? body.processTitle : null,
        processDesc: body.processDesc !== undefined ? body.processDesc : null,
        privacyTitle: body.privacyTitle !== undefined ? body.privacyTitle : null,
        privacyDesc: body.privacyDesc !== undefined ? body.privacyDesc : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Produk baru berhasil ditambahkan.',
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal menambah produk: ${msg}` },
      { status: 500 }
    );
  }
}
