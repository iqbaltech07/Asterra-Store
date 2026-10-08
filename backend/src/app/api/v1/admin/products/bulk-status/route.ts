import { NextRequest, NextResponse } from 'next/server';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * POST /api/v1/admin/products/bulk-status
 * Updates status ('active' | 'archived') for multiple products in a single database round-trip
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
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Daftar ID produk yang dipilih wajib diisi.' },
        { status: 400 }
      );
    }

    if (status !== 'active' && status !== 'archived') {
      return NextResponse.json(
        { success: false, message: 'Status harus berupa "active" atau "archived".' },
        { status: 400 }
      );
    }

    const { count } = await PrismaCatalogRepository.bulkUpdateStatus(ids, status);

    const actionText = status === 'active' ? 'diaktifkan' : 'diarsipkan';
    const message = `Berhasil ${actionText} ${count} produk secara massal.`;

    return NextResponse.json({
      success: true,
      message,
      count,
      status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal memperbarui status produk massal: ${msg}` },
      { status: 500 }
    );
  }
}
