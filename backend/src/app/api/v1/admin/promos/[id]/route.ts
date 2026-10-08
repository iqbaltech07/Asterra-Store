import { NextRequest, NextResponse } from 'next/server';
import { PromoService } from '@/lib/services/promo.service';

/**
 * PATCH /api/v1/admin/promos/[id]
 * Toggle active status of a promo code
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await PromoService.togglePromoStatus(id);

    return NextResponse.json({
      success: true,
      message: `Status promo "${updated.code}" berhasil diubah menjadi ${
        updated.isActive ? 'Aktif' : 'Nonaktif'
      }.`,
      data: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memperbarui status promo.';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

/**
 * DELETE /api/v1/admin/promos/[id]
 * Remove promo code permanently
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await PromoService.deletePromo(id);

    return NextResponse.json({
      success: true,
      message: 'Kode promo berhasil dihapus.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus kode promo.';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
