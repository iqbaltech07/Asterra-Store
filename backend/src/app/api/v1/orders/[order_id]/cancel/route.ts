import { NextRequest, NextResponse } from 'next/server';
import { OrderAdminService } from '@/lib/services/order-admin.service';

/**
 * POST /api/v1/orders/[order_id]/cancel
 * System / Client-side auto-cancel endpoint for expired orders
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const { order_id } = await params;

    const existingOrder = await OrderAdminService.getOrderById(order_id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (existingOrder.order_status === 'completed' || existingOrder.order_status === 'processing') {
      return NextResponse.json(
        { success: false, error: 'Pesanan yang telah dibayar atau diproses tidak dapat dibatalkan.' },
        { status: 400 }
      );
    }

    if (existingOrder.order_status === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Pesanan sudah berstatus dibatalkan.',
        order: existingOrder,
      });
    }

    // Cancel order
    const updated = await OrderAdminService.updateStatus(
      order_id,
      'cancelled',
      'system',
      'Pesanan dibatalkan otomatis oleh sistem karena melewati batas waktu pembayaran 24 jam.'
    );

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan.',
      order: updated,
    });
  } catch (error) {
    console.error('[CancelOrderAPI] Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membatalkan pesanan.' },
      { status: 500 }
    );
  }
}
