import { NextRequest, NextResponse } from 'next/server';
import { OrderAdminService } from '@/lib/services/order-admin.service';

/**
 * GET /api/v1/admin/orders/[id]
 * Fetch detailed order specifications, items, and chronological timeline logs
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await OrderAdminService.getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Pesanan dengan ID ${id} tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[AdminOrdersAPI] Error fetching order detail:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat detail pesanan.' },
      { status: 500 }
    );
  }
}
