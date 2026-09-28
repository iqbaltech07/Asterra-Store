import { NextRequest, NextResponse } from 'next/server';
import { AdminCatalogStore } from '@/lib/services/admin-catalog-store';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * POST /api/v1/admin/refresh-stock
 * Check live stock availability and provider prices from VIP Reseller
 * to aid decision making
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
    const result = await AdminCatalogStore.refreshProviderStatuses();

    return NextResponse.json({
      success: true,
      message: `Pengecekan live selesai. ${result.updated} produk terhubung diperbarui. Ditemukan ${result.warningsCount} produk dengan stok provider kosong.`,
      data: result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal memperbarui status live provider: ${msg}` },
      { status: 500 }
    );
  }
}
