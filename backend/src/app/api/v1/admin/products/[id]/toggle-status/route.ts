import { NextRequest, NextResponse } from 'next/server';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * POST /api/v1/admin/products/:id/toggle-status
 * 1-click toggle between active and archived
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const updated = await PrismaCatalogRepository.toggleProductStatus(id);

  if (!updated) {
    return NextResponse.json(
      { success: false, message: 'Produk tidak ditemukan.' },
      { status: 404 }
    );
  }

  const statusLabel =
    updated.status === 'active'
      ? 'Produk kini AKTIF dan muncul di katalog toko.'
      : 'Produk kini DIARSIPKAN dan disembunyikan dari katalog toko.';

  return NextResponse.json({
    success: true,
    message: statusLabel,
    data: updated,
  });
}
