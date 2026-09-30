import { NextRequest, NextResponse } from 'next/server';
import { vipResellerService } from '@/lib/services/vip-reseller.service';
import { AdminCatalogStore } from '@/lib/services/admin-catalog-store';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { prisma } from '@/lib/prisma';
import { mapCategory, getProductImageUrl } from '@/lib/services/product-mapper';

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

    // Check which items are already imported in Asterra DB (prisma.product)
    let importedCodes = new Set<string>();
    const importedIdMap = new Map<string, string>();

    try {
      const dbProducts = await prisma.product.findMany({
        select: { id: true, providerCode: true },
      });
      for (const p of dbProducts) {
        if (p.providerCode) {
          const codeUpper = p.providerCode.toUpperCase();
          importedCodes.add(codeUpper);
          importedIdMap.set(codeUpper, p.id);
        }
        importedCodes.add(p.id.toUpperCase());
      }
    } catch {
      // Fallback to in-memory store if DB error
      const allStoreProducts = AdminCatalogStore.getAllProducts();
      importedCodes = new Set(
        allStoreProducts
          .filter((p) => p.providerCode)
          .map((p) => p.providerCode?.toUpperCase() as string)
      );
    }

    const enrichedItems = items.slice(0, limit).map((s) => {
      const codeUpper = s.code.toUpperCase();
      const generatedId = `vip-${s.code.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`.toUpperCase();
      const isImported = importedCodes.has(codeUpper) || importedCodes.has(generatedId);
      return {
        ...s,
        isImported,
        importedProductId: importedIdMap.get(codeUpper) || undefined,
      };
    });

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

    const id = `vip-${rawService.code.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

    let basePrice = 0;
    if (typeof rawService.price === 'object' && rawService.price !== null) {
      basePrice = rawService.price.basic || rawService.price.premium || 0;
    } else if (typeof rawService.price === 'number') {
      basePrice = rawService.price;
    }

    const providerPrice =
      body.providerPrice !== undefined ? Number(body.providerPrice) : basePrice;

    const defaultCat = mapCategory(rawService.type, rawService.brand, rawService.name);
    const category = {
      id: body.categoryId || defaultCat.id,
      name: body.categoryName || defaultCat.name,
    };

    const name = body.name || rawService.name;
    const status = (body.status as 'active' | 'archived') || 'archived';
    const providerStatus = rawService.status === 'available' ? 'available' : 'empty';
    // [T10] Jika stok dari vip reseller habis maka set ke 0 langsung
    const stock =
      providerStatus === 'empty'
        ? 0
        : body.stock !== undefined
          ? Math.max(0, Number(body.stock))
          : 100;

    let profitMargin: number | null = null;
    let profitPercentage: number | null = null;
    if (providerPrice > 0) {
      profitMargin = price - providerPrice;
      profitPercentage = Math.round((profitMargin / providerPrice) * 100);
    }

    const brand = rawService.brand || 'Digital';
    const features =
      body.features || [
        `Brand: ${brand}`,
        `Kode Provider: ${rawService.code}`,
        `Ketersediaan Supplier: ${providerStatus === 'available' ? 'Tersedia' : 'Kosong'}`,
        rawService.note && rawService.note !== '-'
          ? `Catatan: ${rawService.note}`
          : 'Proses aktivasi cepat & bergaransi',
      ];

    const description =
      body.description ||
      (rawService.note && rawService.note !== '-'
        ? `${name}. ${rawService.note}`
        : `${name} - Layanan digital resmi terverifikasi.`);

    const imageUrl =
      body.imageUrl || getProductImageUrl(rawService.brand, rawService.type);

    // Save directly to Asterra Database
    const dbProduct = await prisma.product.upsert({
      where: { id },
      update: {
        name,
        categoryId: category.id,
        categoryName: category.name,
        brand,
        price,
        priceFormatted: `Rp ${Math.round(price / 1000)} Rb`,
        description,
        features,
        status,
        stock,
        imageUrl,
        provider: 'vip-reseller',
        providerCode: rawService.code,
        providerName: rawService.name,
        providerPrice,
        providerStatus,
        lastProviderCheck: new Date(),
        profitMargin,
        profitPercentage,
      },
      create: {
        id,
        name,
        categoryId: category.id,
        categoryName: category.name,
        brand,
        price,
        priceFormatted: `Rp ${Math.round(price / 1000)} Rb`,
        description,
        features,
        status,
        stock,
        imageUrl,
        popular: false,
        provider: 'vip-reseller',
        providerCode: rawService.code,
        providerName: rawService.name,
        providerPrice,
        providerStatus,
        lastProviderCheck: new Date(),
        profitMargin,
        profitPercentage,
      },
    });

    // Synchronize in-memory catalog store
    AdminCatalogStore.importFromVipReseller(rawService, {
      name,
      price,
      categoryId: category.id,
      categoryName: category.name,
      description,
      features,
      status,
      imageUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Produk "${dbProduct.name}" berhasil diimpor ke katalog Asterra Store dengan status ${dbProduct.status.toUpperCase()}.`,
      data: dbProduct,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal mengimpor produk VIP: ${msg}` },
      { status: 500 }
    );
  }
}
