import { NextRequest, NextResponse } from 'next/server';
import { OrderAdminService } from '@/lib/services/order-admin.service';

const ALLOWED_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;
type OrderStatusType = (typeof ALLOWED_STATUSES)[number];

/**
 * PATCH /api/v1/admin/orders/[id]/status
 * Update order status manually by administrator with optional audit note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status || !ALLOWED_STATUSES.includes(status as OrderStatusType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status '${status}' tidak valid. Pilihan: ${ALLOWED_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updatedOrder = await OrderAdminService.updateStatus(
      id,
      status as OrderStatusType,
      'admin',
      notes || `Status pesanan diubah menjadi ${status} secara manual oleh admin`
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: `Pesanan dengan ID ${id} tidak ditemukan.` },
        { status: 404 }
      );
    }

    const safeData = {
      ...updatedOrder,
      id: updatedOrder.id || id,
    };

    return NextResponse.json({
      success: true,
      message: `Status pesanan ${id} berhasil diperbarui menjadi '${status}'.`,
      data: safeData,
    });
  } catch (error) {
    console.error('[AdminOrdersAPI] Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status pesanan.' },
      { status: 500 }
    );
  }
}
