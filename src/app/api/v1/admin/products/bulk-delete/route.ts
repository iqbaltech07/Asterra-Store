import { NextRequest, NextResponse } from 'next/server';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * POST /api/v1/admin/products/bulk-delete
 * Permanently delete multiple products in a single database operation
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
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Daftar ID produk yang akan dihapus wajib diisi.' },
        { status: 400 }
      );
    }

    const { count } = await PrismaCatalogRepository.bulkDeleteProducts(ids);

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${count} produk terpilih dari sistem Asterra Store.`,
      count,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal menghapus produk massal: ${msg}` },
      { status: 500 }
    );
  }
}
