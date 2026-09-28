import { NextRequest, NextResponse } from 'next/server';
import { vipResellerService } from '@/lib/services/vip-reseller.service';
import { AdminCatalogStore } from '@/lib/services/admin-catalog-store';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * GET /api/v1/admin/vip-services
 * Browse raw services from VIP Reseller API with filtering
 */
export async function GET(req: NextRequest) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim();
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined; // 'available' | 'empty'
    const forceRefresh = searchParams.get('force_refresh') === 'true';
    const limit = Math.min(Number(searchParams.get('limit') || 2500), 5000);

    const response = await vipResellerService.getAllAggregatedServices({ forceRefresh });

    if (!response.result || !Array.isArray(response.data)) {
      const blockedIpMatch = response.message?.match(/IP\s+([\d\.]+)/i);
      const blockedIp = blockedIpMatch ? blockedIpMatch[1] : undefined;

      return NextResponse.json(
        {
          success: false,
          isIpBlocked: Boolean(blockedIp),
          blockedIp,
          message: blockedIp
            ? `IP publik Anda (${blockedIp}) belum didaftarkan di Whitelist API VIP Reseller. Silakan tambahkan IP ini di menu Pengaturan API dashboard VIP Reseller.`
            : response.message ||
              'Gagal mengambil daftar layanan dari gateway VIP Reseller.',
        },
        { status: 502 }
      );
    }

    let items = response.data.filter((item) => item.code && item.name);

    if (type && type !== 'all') {
      items = items.filter((item) => item.type === type);
    }

    if (status && status !== 'all') {
      items = items.filter((item) => item.status === status);
    }

    if (search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.code.toLowerCase().includes(search) ||
          (item.brand && item.brand.toLowerCase().includes(search))
      );
    }

    // Check which items are already imported in Asterra Store
    const allStoreProducts = AdminCatalogStore.getAllProducts();
    const importedCodes = new Set(
      allStoreProducts
        .filter((p) => p.providerCode)
        .map((p) => p.providerCode?.toUpperCase())
    );

    const enrichedItems = items.slice(0, limit).map((s) => ({
      ...s,
      isImported: importedCodes.has(s.code.toUpperCase()),
      importedProductId: allStoreProducts.find(
        (p) => p.providerCode?.toUpperCase() === s.code.toUpperCase()
      )?.id,
    }));

    // Available types and brands for filter dropdowns
    const availableTypes = [...new Set(response.data.map((d) => d.type).filter(Boolean))];
    const availableBrands = [...new Set(response.data.map((d) => d.brand).filter(Boolean))].slice(
      0,
      30
    );

    const cacheInfo = vipResellerService.getCacheInfo();

    return NextResponse.json({
      success: true,
      total: items.length,
      limit,
      cached: cacheInfo.hasMasterCache,
      cacheAgeSeconds: cacheInfo.ageSeconds,
      availableTypes,
      availableBrands,
      data: enrichedItems,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Error fetching VIP Reseller services: ${msg}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/vip-services
 * Import raw VIP Reseller service into Asterra Store with custom retail price and details
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
    const body = await req.json();

    if (!body.code || !body.price) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kode layanan VIP Reseller dan harga jual retail wajib ditentukan.',
        },
        { status: 400 }
      );
    }

    const price = Number(body.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: 'Harga retail harus berupa angka valid.' },
        { status: 400 }
      );
    }

    // Get the service data from VIP Reseller
    const response = await vipResellerService.getAllAggregatedServices();
    if (!response.result || !Array.isArray(response.data)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gagal menghubungi server VIP Reseller untuk validasi layanan.',
        },
        { status: 502 }
      );
    }

    const rawService = response.data.find(
      (s) => s.code.toUpperCase() === String(body.code).toUpperCase()
    );

    if (!rawService) {
      return NextResponse.json(
        {
          success: false,
          message: `Layanan dengan kode ${body.code} tidak ditemukan di VIP Reseller.`,
        },
        { status: 404 }
      );
    }

    const importedProduct = AdminCatalogStore.importFromVipReseller(rawService, {
      name: body.name || rawService.name,
      price,
      categoryId: body.categoryId,
      categoryName: body.categoryName,
      description: body.description,
      features: body.features,
      status: body.status || 'archived',
      imageUrl: body.imageUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Produk "${importedProduct.name}" berhasil diimpor ke katalog Asterra Store dengan status ${importedProduct.status.toUpperCase()}.`,
      data: importedProduct,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal mengimpor produk VIP: ${msg}` },
      { status: 500 }
    );
  }
}
